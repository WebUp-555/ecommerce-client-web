import { useEffect, useState } from 'react';
import { deleteUnpaidAiDesign, getAllAiDesigns, getPrintableAiDesign, moderateAiDesign } from '../utils/api';

const statusClassMap = {
  completed: 'bg-green-100 text-green-800',
  approved: 'bg-emerald-100 text-emerald-800',
  processing: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  disabled: 'bg-gray-200 text-gray-800',
};

export default function AiDesigns() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [printPreview, setPrintPreview] = useState('');
  const [busyId, setBusyId] = useState('');

  const fetchDesigns = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAllAiDesigns();
      setDesigns(response.designs || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load AI designs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  const openPrintable = async (designId) => {
    setBusyId(designId);
    try {
      const response = await getPrintableAiDesign(designId);
      const image = response?.design?.printableImage || '';
      if (!image) {
        throw new Error('Printable image not available');
      }
      setPrintPreview(image);
      const found = designs.find((design) => design._id === designId) || null;
      setSelectedDesign(found);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not load printable image');
    } finally {
      setBusyId('');
    }
  };

  const handleModeration = async (designId, action) => {
    const reason = window.prompt(`Reason for ${action} (optional):`, '') || '';
    setBusyId(designId);
    setError('');
    try {
      await moderateAiDesign(designId, action, reason);
      await fetchDesigns();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || `Failed to ${action} design`);
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async (designId) => {
    const confirmed = window.confirm('Delete this unpaid AI design? This cannot be undone.');
    if (!confirmed) return;

    setBusyId(designId);
    setError('');
    try {
      await deleteUnpaidAiDesign(designId);
      if (selectedDesign?._id === designId) {
        setSelectedDesign(null);
        setPrintPreview('');
      }
      await fetchDesigns();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to delete unpaid design');
    } finally {
      setBusyId('');
    }
  };

  const downloadPrintImage = () => {
    if (!printPreview) return;
    const anchor = document.createElement('a');
    anchor.href = printPreview;
    anchor.download = `ai-design-${selectedDesign?._id || Date.now()}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Design Print Queue</h2>
        <p className="text-gray-600">View, moderate, and download printable AI-generated T-shirt designs.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-700">Loading AI designs...</div>
      ) : designs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow text-gray-600">No AI designs found</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Design</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Prompt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {designs.map((design) => {
                  const status = design.status || 'processing';
                  const orderStatus = design.lockedOrder?.status || 'unpaid';
                  const canPrint = orderStatus === 'paid';
                  const canDelete = orderStatus !== 'paid';
                  return (
                    <tr key={design._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                        #{design._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div>{design.user?.username || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{design.user?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClassMap[status] || 'bg-gray-100 text-gray-700'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${canPrint ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                          {orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-sm truncate" title={design.prompt}>
                        {design.prompt}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => openPrintable(design._id)}
                          disabled={busyId === design._id || !canPrint}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          title={canPrint ? 'View printable file' : 'Printable view is only for paid orders'}
                        >
                          Print File
                        </button>
                        <button
                          onClick={() => handleModeration(design._id, 'approve')}
                          disabled={busyId === design._id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleModeration(design._id, 'reject')}
                          disabled={busyId === design._id}
                          className="px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleModeration(design._id, 'disable')}
                          disabled={busyId === design._id}
                          className="px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50"
                        >
                          Disable
                        </button>
                        <button
                          onClick={() => handleDelete(design._id)}
                          disabled={busyId === design._id || !canDelete}
                          className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          title={canDelete ? 'Delete unpaid design' : 'Paid design cannot be deleted'}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {printPreview && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Printable Design Preview</h3>
            <button
              onClick={downloadPrintImage}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Download PNG
            </button>
          </div>
          <div className="border border-gray-200 rounded bg-gray-50 p-4">
            <img src={printPreview} alt="Printable AI design" className="max-h-[520px] w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
