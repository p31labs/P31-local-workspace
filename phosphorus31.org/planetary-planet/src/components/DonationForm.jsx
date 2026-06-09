import React, { useState } from 'react';

const DonationForm = () => {
  const [amount, setAmount] = useState(50);
  const [frequency, setFrequency] = useState('one-time');
  const [loading, setLoading] = useState(false);

  const presets = [5, 10, 25, 50];

  const handleCustomChange = (e) => {
    // Strip non-numeric characters to prevent NaN errors
    const val = e.target.value.replace(/[^0-9]/g, '');
    setAmount(val === '' ? '' : parseInt(val, 10));
  };

  const handleCheckout = async () => {
    if (!amount || amount < 1) {
      alert("Please enter a valid donation amount.");
      return;
    }
    
    setLoading(true);
    try {
      const WORKER_URL = 'https://p31-donation-relay.p31ca.workers.dev'; 
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, frequency }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error('Checkout failed. Serialization layer dropped packets:', err);
      alert('Checkout initialization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-box p-8 rounded-3xl max-w-md mx-auto border-t-4 border-t-teal-600 shadow-xl bg-white">
      <div className="w-16 h-16 bg-gradient-to-br from-coral-500 to-butter rounded-2xl mx-auto mb-6 flex items-center justify-center text-white font-black text-2xl shadow-md">
        P
      </div>
      <h3 className="font-heading font-black text-3xl text-espresso mb-2 text-center">Donate to P31 Labs</h3>
      <p className="text-sm text-espresso/60 text-center mb-8">Choose an amount below. Payments processed securely via Stripe.</p>
      
      {/* Frequency Toggle */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setFrequency('one-time')} className={`flex-1 py-3 rounded-xl font-bold transition-colors border-2 ${frequency === 'one-time' ? 'border-teal-600 bg-teal-600/10 text-teal-700' : 'border-cloud text-espresso/60 hover:bg-cloud/50'}`}>One-Time</button>
        <button onClick={() => setFrequency('monthly')} className={`flex-1 py-3 rounded-xl font-bold transition-colors border-2 ${frequency === 'monthly' ? 'border-teal-600 bg-teal-600/10 text-teal-700' : 'border-cloud text-espresso/60 hover:bg-cloud/50'}`}>Monthly</button>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {presets.map(preset => (
          <button 
            key={preset} 
            onClick={() => setAmount(preset)} 
            className={`py-3 rounded-xl font-mono font-bold text-lg border-2 transition-colors ${amount === preset ? 'border-teal-600 bg-teal-600 text-white' : 'border-cloud text-espresso/70 hover:border-teal-600/30'}`}
          >
            ${preset}
          </button>
        ))}
      </div>

      {/* Custom Input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-espresso/40 font-mono font-bold text-lg">$</span>
        </div>
        <input 
          type="text" 
          value={amount} 
          onChange={handleCustomChange}
          className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-cloud focus:border-teal-600 focus:ring-0 font-mono font-bold text-lg text-espresso transition-colors outline-none"
          placeholder="Custom Amount"
        />
      </div>

      {/* Execute Button */}
      <button 
        onClick={handleCheckout} 
        disabled={loading || !amount} 
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xl py-4 rounded-2xl shadow-lg transition-transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
      >
        {loading ? 'Initiating...' : `Donate $${amount || 0}`}
      </button>

      <p className="text-xs text-center text-espresso/50 mt-4">
        Secure payment via Stripe. You will receive an email receipt.
      </p>
    </div>
  );
};

export default DonationForm;
