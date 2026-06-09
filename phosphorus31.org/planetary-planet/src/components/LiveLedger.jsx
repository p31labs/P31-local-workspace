import React from 'react';

const LiveLedger = () => {
  // Mock Financial Data for Prototype
  const transactions = [
    { id: 1, date: 'Mar 07, 2026', desc: 'Cloudflare Enterprise (Monthly)', amount: -250.00, tag: 'Infrastructure', type: 'out' },
    { id: 2, date: 'Mar 06, 2026', desc: 'Anonymous Donor (ETH to USD)', amount: 1500.00, tag: 'Donation', type: 'in' },
    { id: 3, date: 'Mar 04, 2026', desc: '3D Printer Filament (Tetrahedrons)', amount: -45.99, tag: 'Hardware', type: 'out' },
    { id: 4, date: 'Mar 01, 2026', desc: 'Anthropic API Usage (Centaur)', amount: -112.50, tag: 'AI Services', type: 'out' },
    { id: 5, date: 'Feb 28, 2026', desc: 'Monthly Sustaining Donors', amount: 840.00, tag: 'Donation', type: 'in' },
  ];

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-cloud/50 text-espresso/60 text-sm font-bold uppercase tracking-wider">
          <th className="p-4 border-b border-cloud">Date</th>
          <th className="p-4 border-b border-cloud">Description</th>
          <th className="p-4 border-b border-cloud">Category</th>
          <th className="p-4 border-b border-cloud text-right">Amount</th>
        </tr>
      </thead>
      <tbody className="text-sm divide-y divide-cloud">
        {transactions.map(tx => (
          <tr key={tx.id} className="hover:bg-cloud/30 transition-colors">
            <td className="p-4 text-espresso/60 whitespace-nowrap">{tx.date}</td>
            <td className="p-4 font-medium text-espresso">{tx.desc}</td>
            <td className="p-4">
              <span className="bg-cloud text-espresso/70 px-2.5 py-1 rounded text-xs font-bold">{tx.tag}</span>
            </td>
            <td className={`p-4 text-right font-bold font-mono ${tx.type === 'in' ? 'text-teal-600' : 'text-espresso'}`}>
              {tx.type === 'in' ? '+' : ''}{tx.amount.toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default LiveLedger;