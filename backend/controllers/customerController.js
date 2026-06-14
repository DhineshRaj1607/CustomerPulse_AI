const Customer = require('../models/Customer');

const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch customers', error: error.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch customer', error: error.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, city, totalOrders, totalSpend, lastPurchaseDate, segment, status } = req.body;
    const customer = new Customer({
      name,
      email,
      phone,
      city,
      totalOrders,
      totalSpent: totalSpend,
      lastPurchaseDate,
      segment,
      status,
    });
    const createdCustomer = await customer.save();
    res.status(201).json(createdCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create customer', error: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, city, totalOrders, totalSpend, lastPurchaseDate, segment, status } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.name = name ?? customer.name;
    customer.email = email ?? customer.email;
    customer.phone = phone ?? customer.phone;
    customer.city = city ?? customer.city;
    customer.totalOrders = totalOrders ?? customer.totalOrders;
    customer.totalSpent = totalSpend ?? customer.totalSpent;
    customer.lastPurchaseDate = lastPurchaseDate ?? customer.lastPurchaseDate;
    customer.segment = segment ?? customer.segment;
    customer.status = status ?? customer.status;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update customer', error: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await customer.deleteOne();
    res.json({ message: 'Customer removed' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete customer', error: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};