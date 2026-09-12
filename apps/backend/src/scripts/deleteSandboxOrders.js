// Delete sandbox test orders from the database the local .env points at
// (the production MongoDB Atlas cluster).
//
// SAFETY: dry-run by default — lists matching orders and exits. Deletion only
// happens with BOTH a target flag AND --confirm:
//
//   node src/scripts/deleteSandboxOrders.js                        # dry run: list ALL orders
//   node src/scripts/deleteSandboxOrders.js --id <orderId> --confirm
//   node src/scripts/deleteSandboxOrders.js --sandbox-only --confirm
//   node src/scripts/deleteSandboxOrders.js --all --confirm
//
// --sandbox-only matches PayPal sandbox buyer accounts (emails ending in
// @example.com / @personal.example.com — PayPal's sandbox convention).
// Deleting an order also deletes ReturnRequests referencing it.

import mongoose from 'mongoose';
import Order from '../models/Order.js';
import ReturnRequest from '../models/ReturnRequest.js';

export const isSandboxOrder = (order) => {
  const email = order.customerEmail || order.paymentDetails?.paypalPayerEmail || '';
  return /@(personal\.)?example\.com$/i.test(email);
};

const parseArgs = (argv) => {
  const args = { ids: [] };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--id') args.ids.push(argv[i + 1] && String(argv[i + 1]));
    else if (argv[i] === '--sandbox-only') args.sandboxOnly = true;
    else if (argv[i] === '--all') args.all = true;
    else if (argv[i] === '--confirm') args.confirm = true;
  }
  args.ids = args.ids.filter(Boolean);
  return args;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set — check apps/backend/.env');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Loading orders…\n');

  const orders = await Order.find({})
    .select('orderNumber createdAt customerEmail totalAmount status isGuest paymentDetails.paypalPayerEmail')
    .sort({ createdAt: 1 })
    .lean();

  if (orders.length === 0) {
    console.log('No orders in the database. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  const selected = args.ids.length > 0
    ? orders.filter((o) => args.ids.includes(String(o._id)))
    : args.all
      ? orders
      : args.sandboxOnly
        ? orders.filter(isSandboxOrder)
        : orders; // dry run defaults to showing everything

  for (const o of orders) {
    const marked = selected.some((s) => String(s._id) === String(o._id));
    console.log(
      `${marked ? '→ DELETE' : '  keep '}  ${o.orderNumber}  ${new Date(o.createdAt).toISOString().slice(0, 16)}  £${(o.totalAmount ?? 0).toFixed(2)}  ${o.status}  ${o.isGuest ? 'guest' : 'user'}  ${o.customerEmail || o.paymentDetails?.paypalPayerEmail || 'no email'}  [${o._id}]`
    );
  }

  if (!args.confirm) {
    console.log(`\nDRY RUN — ${selected.length} of ${orders.length} order(s) would be deleted.`);
    console.log('Re-run with --id <orderId> (repeatable), --sandbox-only, or --all, plus --confirm, to delete.');
    await mongoose.disconnect();
    return;
  }

  const ids = selected.map((o) => o._id);
  const returns = await ReturnRequest.deleteMany({ orderId: { $in: ids } });
  const result = await Order.deleteMany({ _id: { $in: ids } });
  console.log(`\nDeleted ${result.deletedCount} order(s) and ${returns.deletedCount} linked return request(s).`);
  await mongoose.disconnect();
};

if (process.argv[1] && process.argv[1].endsWith('deleteSandboxOrders.js')) {
  main().catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
}
