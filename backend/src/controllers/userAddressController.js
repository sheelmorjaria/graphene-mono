import User from '../models/User.js';

// Get all user addresses
export const getUserAddresses = async (req, res) => {
  try {
    const user = req.user; // Set by authentication middleware

    res.json({
      success: true,
      data: {
        addresses: user.shippingAddresses || []
      }
    });
  } catch (error) {
    console.error('Get user addresses error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while fetching addresses'
    });
  }
};

// Add new address
export const addUserAddress = async (req, res) => {
  try {
    const user = req.user; // Set by authentication middleware
    const {
      fullName,
      addressLine1,
      addressLine2,
      city,
      stateProvince,
      postalCode,
      country,
      phoneNumber
    } = req.body;

    // Input validation
    if (!fullName || !addressLine1 || !city || !stateProvince || !postalCode || !country) {
      return res.status(400).json({
        success: false,
        error: 'Full name, address line 1, city, state/province, postal code, and country are required'
      });
    }

    // Validate phone number format if provided
    if (phoneNumber) {
      const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{0,20}$/;
      if (!phoneRegex.test(phoneNumber.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid phone number'
        });
      }
    }

    // Create new address object
    const newAddress = {
      fullName: fullName.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : undefined,
      city: city.trim(),
      stateProvince: stateProvince.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
      isDefault: user.shippingAddresses.length === 0 // First address is default
    };

    // Add address to user
    user.shippingAddresses.push(newAddress);
    await user.save();

    // Get the newly added address (with its generated _id)
    const addedAddress = user.shippingAddresses[user.shippingAddresses.length - 1];

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: {
        address: addedAddress
      }
    });

  } catch (error) {
    console.error('Add address error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error occurred while adding address'
    });
  }
};

// Update existing address
export const updateUserAddress = async (req, res) => {
  try {
    const user = req.user; // Set by authentication middleware
    const { addressId } = req.params;
    const {
      fullName,
      addressLine1,
      addressLine2,
      city,
      stateProvince,
      postalCode,
      country,
      phoneNumber
    } = req.body;

    // Find the address
    const address = user.shippingAddresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    // Input validation
    if (!fullName || !addressLine1 || !city || !stateProvince || !postalCode || !country) {
      return res.status(400).json({
        success: false,
        error: 'Full name, address line 1, city, state/province, postal code, and country are required'
      });
    }

    // Validate phone number format if provided
    if (phoneNumber) {
      const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{0,20}$/;
      if (!phoneRegex.test(phoneNumber.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid phone number'
        });
      }
    }

    // Update address fields
    address.fullName = fullName.trim();
    address.addressLine1 = addressLine1.trim();
    address.addressLine2 = addressLine2 ? addressLine2.trim() : undefined;
    address.city = city.trim();
    address.stateProvince = stateProvince.trim();
    address.postalCode = postalCode.trim();
    address.country = country.trim();
    address.phoneNumber = phoneNumber ? phoneNumber.trim() : undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: {
        address: address
      }
    });

  } catch (error) {
    console.error('Update address error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error occurred while updating address'
    });
  }
};

// Delete address
export const deleteUserAddress = async (req, res) => {
  try {
    const user = req.user; // Set by authentication middleware
    const { addressId } = req.params;

    // Find the address
    const address = user.shippingAddresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    const wasDefault = address.isDefault;

    // Remove the address
    user.shippingAddresses.pull(addressId);

    // If the deleted address was default and there are remaining addresses,
    // make the first remaining address the new default
    if (wasDefault && user.shippingAddresses.length > 0) {
      user.shippingAddresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while deleting address'
    });
  }
};