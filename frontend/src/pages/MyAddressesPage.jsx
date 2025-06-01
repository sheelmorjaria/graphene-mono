import React, { useState, useEffect } from 'react';
import { getUserAddresses, addUserAddress, updateUserAddress, deleteUserAddress } from '../services/addressService';
import AddressForm from '../components/AddressForm';

const MyAddressesPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getUserAddresses();
      setAddresses(response.data.addresses || []);
    } catch (err) {
      setError(err.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowForm(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await deleteUserAddress(addressId);
      await loadAddresses(); // Reload to get updated list
    } catch (err) {
      setError(err.message || 'Failed to delete address');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError('');

      if (editingAddress) {
        await updateUserAddress(editingAddress._id, formData);
      } else {
        await addUserAddress(formData);
      }

      await loadAddresses(); // Reload to get updated list
      setShowForm(false);
      setEditingAddress(null);
    } catch (err) {
      setError(err.message || 'Failed to save address');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAddress(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="my-addresses-page">
        <div className="loading">Loading addresses...</div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="my-addresses-page">
        <div className="page-header">
          <h1>{editingAddress ? 'Edit Address' : 'Add New Address'}</h1>
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <AddressForm
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          initialData={editingAddress}
          isEdit={!!editingAddress}
          isLoading={formLoading}
        />
      </div>
    );
  }

  return (
    <div className="my-addresses-page">
      <div className="page-header">
        <h1>My Addresses</h1>
        <button 
          onClick={handleAddAddress}
          className="btn btn-primary"
        >
          Add New Address
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="no-addresses">
          <p>You haven't added any addresses yet.</p>
          <button 
            onClick={handleAddAddress}
            className="btn btn-primary"
          >
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="addresses-list">
          {addresses.map((address) => (
            <div key={address._id} className={`address-card ${address.isDefault ? 'default' : ''}`}>
              {address.isDefault && (
                <div className="default-badge">Default</div>
              )}
              
              <div className="address-details">
                <div className="full-name">{address.fullName}</div>
                <div className="address-lines">
                  <div>{address.addressLine1}</div>
                  {address.addressLine2 && <div>{address.addressLine2}</div>}
                  <div>
                    {address.city}, {address.stateProvince} {address.postalCode}
                  </div>
                  <div>{address.country}</div>
                  {address.phoneNumber && (
                    <div className="phone">Phone: {address.phoneNumber}</div>
                  )}
                </div>
              </div>

              <div className="address-actions">
                <button
                  onClick={() => handleEditAddress(address)}
                  className="btn btn-secondary"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAddress(address._id)}
                  className="btn btn-danger"
                  disabled={addresses.length === 1}
                  title={addresses.length === 1 ? 'Cannot delete your only address' : 'Delete address'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAddressesPage;