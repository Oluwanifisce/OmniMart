const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  title: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Crucial for routing data to separate vendor dashboards
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile' },
  itemStatus: { type: String, default: 'pending' },
}, { _id: true });

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paystackReference: { type: String, required: true, unique: true, sparse: true },
    totalAmount: { type: Number, required: true }, // Total in Naira
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    orderStatus: { type: String, default: 'pending' },
    shippingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '100001' },
      country: { type: String, default: 'Nigeria' },
      phone: { type: String, default: '' },
    },
    paymentInfo: {
      method: { type: String, default: 'Paystack' },
      status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
      transactionId: { type: String },
    },
    items: [orderItemSchema],
  },
  { timestamps: true }
);

// Pre-save synchronization hook
OrderSchema.pre('save', function (next) {
  if (this.user && !this.customer) this.customer = this.user;
  if (this.customer && !this.user) this.user = this.customer;
  if (this.status && !this.orderStatus) this.orderStatus = this.status;
  if (this.orderStatus === 'paid' && this.status !== 'paid') this.status = 'paid';
  if (this.status === 'paid' && this.paymentInfo) this.paymentInfo.status = 'paid';
  if (this.items && Array.isArray(this.items)) {
    this.items.forEach(item => {
      if (item.vendorId && !item.vendor) item.vendor = item.vendorId;
      if (item.vendor && !item.vendorId) item.vendorId = item.vendor;
    });
  }
  next();
});

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

module.exports = Order;
