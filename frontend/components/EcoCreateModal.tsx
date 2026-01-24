'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

interface CurrentUser {
  id: string;
  name: string;
  loginId: string;
  email: string;
  role: string;
}

interface EcoCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
  onComplete?: () => void;
}

interface ProductOption {
  productId: number;
  productCode: string;
  productName: string;
}

interface BomOption {
  bomId: number;
  versionNo: number;
}

interface UserOption {
  id: number;
  name: string;
  loginId: string;
  email: string;
}

interface EcoFormState {
  title: string;
  ecoType: '' | 'product' | 'bom';
  productId: string;
  bomId: string;
  raisedById: string;
  effectiveDate: string;
  versionUpdate: boolean;
}

const emptyForm: EcoFormState = {
  title: '',
  ecoType: '',
  productId: '',
  bomId: '',
  raisedById: '',
  effectiveDate: '',
  versionUpdate: true
};

export function EcoCreateModal({ isOpen, onClose, currentUser, onComplete }: EcoCreateModalProps) {
  const [form, setForm] = useState<EcoFormState>(emptyForm);
  const [ecoId, setEcoId] = useState<number | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [boms, setBoms] = useState<BomOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [started, setStarted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const currentUserId = useMemo(() => {
    if (!currentUser?.id) {
      return '';
    }
    const parsed = parseInt(currentUser.id, 10);
    return Number.isNaN(parsed) ? '' : String(parsed);
  }, [currentUser?.id]);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      raisedById: currentUserId
    });
    setEcoId(null);
    setMessage(null);
    setStarted(false);
    setIsSaved(false);
    setShowCloseConfirm(false);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetForm();
  }, [isOpen, currentUserId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadOptions = async () => {
      setLoadingOptions(true);
      setMessage(null);
      try {
        const [productsResponse, usersResponse] = await Promise.all([
          apiFetch<{ products: ProductOption[] }>('/api/products?status=active'),
          apiFetch<{ users: UserOption[] }>('/api/users/lookup')
        ]);

        setProducts(productsResponse.data?.products ?? []);
        setUsers(usersResponse.data?.users ?? []);
      } catch (error) {
        const messageText =
          error instanceof ApiError ? error.message : 'Failed to load ECO form data';
        setMessage({ type: 'error', text: messageText });
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (form.ecoType !== 'bom' || !form.productId) {
      setBoms([]);
      setForm((prev) => ({
        ...prev,
        bomId: ''
      }));
      return;
    }

    const loadBoms = async () => {
      setLoadingOptions(true);
      setMessage(null);
      try {
        const response = await apiFetch<{ boms: BomOption[] }>(
          `/api/boms?productId=${form.productId}`
        );
        setBoms(response.data?.boms ?? []);
      } catch (error) {
        const messageText =
          error instanceof ApiError ? error.message : 'Failed to load BoMs for product';
        setMessage({ type: 'error', text: messageText });
      } finally {
        setLoadingOptions(false);
      }
    };

    loadBoms();
  }, [form.ecoType, form.productId, isOpen]);

  if (!isOpen) {
    return null;
  }

  const updateField = (field: keyof EcoFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        event.target.type === 'checkbox'
          ? (event.target as HTMLInputElement).checked
          : event.target.value;

      setForm((prev) => ({
        ...prev,
        [field]: value
      }));
      if (isSaved && !started) {
        setIsSaved(false);
      }
      setMessage(null);
    };

  const handleEcoTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as EcoFormState['ecoType'];
    setForm((prev) => ({
      ...prev,
      ecoType: value,
      bomId: value === 'bom' ? prev.bomId : ''
    }));
    if (isSaved && !started) {
      setIsSaved(false);
    }
    setMessage(null);
  };

  const handleProductChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      productId: value,
      bomId: ''
    }));
    if (isSaved && !started) {
      setIsSaved(false);
    }
    setMessage(null);
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      return 'Title is required';
    }
    if (!form.ecoType) {
      return 'ECO type is required';
    }
    if (!form.productId) {
      return 'Product is required';
    }
    if (form.ecoType === 'bom' && !form.bomId) {
      return 'Bill of Materials is required for BoM ECOs';
    }
    return null;
  };

  const buildPayload = () => {
    const payload: Record<string, any> = {
      title: form.title.trim(),
      ecoType: form.ecoType,
      productId: parseInt(form.productId, 10),
      versionUpdate: form.versionUpdate
    };

    if (form.ecoType === 'bom') {
      payload.bomId = parseInt(form.bomId, 10);
    }

    if (form.effectiveDate) {
      payload.effectiveDate = form.effectiveDate;
    }

    if (isAdmin && form.raisedById) {
      payload.raisedById = parseInt(form.raisedById, 10);
    }

    return payload;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const payload = buildPayload();

      if (!ecoId) {
        const response = await apiFetch<{ eco: { id: number } }>('/api/ecos', {
          method: 'POST',
          body: payload
        });
        setEcoId(response.data?.eco?.id ?? null);
      } else {
        await apiFetch(`/api/ecos/${ecoId}`, {
          method: 'PATCH',
          body: payload
        });
      }

      setIsSaved(true);
      setMessage({ type: 'success', text: 'Draft saved.' });
      onComplete?.();
    } catch (error) {
      const messageText =
        error instanceof ApiError ? error.message : 'Failed to save ECO draft';
      setMessage({ type: 'error', text: messageText });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async () => {
    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return false;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      let workingEcoId = ecoId;
      const payload = buildPayload();

      if (!workingEcoId) {
        const response = await apiFetch<{ eco: { id: number } }>('/api/ecos', {
          method: 'POST',
          body: payload
        });
        workingEcoId = response.data?.eco?.id ?? null;
        setEcoId(workingEcoId);
      } else {
        await apiFetch(`/api/ecos/${workingEcoId}`, {
          method: 'PATCH',
          body: payload
        });
      }

      if (!workingEcoId) {
        throw new Error('Failed to create ECO draft before starting');
      }

      await apiFetch(`/api/ecos/${workingEcoId}/start`, {
        method: 'POST'
      });

      setStarted(true);
      setMessage({ type: 'success', text: 'ECO started and moved to In Progress.' });
      onComplete?.();
      return true;
    } catch (error) {
      const messageText =
        error instanceof ApiError ? error.message : 'Failed to start ECO';
      setMessage({ type: 'error', text: messageText });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseRequest = () => {
    if (isSaved && !started) {
      setShowCloseConfirm(true);
      return;
    }
    onClose();
  };

  const handleCloseAnyway = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const handleConfirmStart = async () => {
    const startedEco = await handleStart();
    if (startedEco) {
      setShowCloseConfirm(false);
      onClose();
    }
  };

  const disableInputs = submitting || started;
  const disableSave = disableInputs || isSaved;
  const disableStart = disableInputs || !isSaved;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 sm:p-6">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl border border-gray-200">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              Engineering Change Order
            </p>
            <h2 className="text-xl font-semibold text-gray-900">New ECO</h2>
            <p className="text-xs text-gray-500">Stage: New</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleStart}
              disabled={disableStart}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              Start
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={disableSave}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-emerald-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCloseRequest}
              disabled={submitting}
              className="rounded-md border border-transparent px-3 py-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {message && (
            <div
              className={`mb-4 rounded-md border px-3 py-2 text-sm ${
                message.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {loadingOptions && (
            <div className="mb-4 text-xs text-gray-500">Loading ECO options...</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={updateField('title')}
                disabled={disableInputs}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                ECO Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.ecoType}
                onChange={handleEcoTypeChange}
                disabled={disableInputs}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
              >
                <option value="">Select ECO type</option>
                <option value="product">Product</option>
                <option value="bom">Bills of Materials</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Product <span className="text-red-500">*</span>
              </label>
              <select
                value={form.productId}
                onChange={handleProductChange}
                disabled={disableInputs}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.productCode} - {product.productName}
                  </option>
                ))}
              </select>
            </div>

            {form.ecoType === 'bom' && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Bill of Materials <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.bomId}
                  onChange={updateField('bomId')}
                  disabled={disableInputs || !form.productId}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
                >
                  <option value="">Select BoM version</option>
                  {boms.map((bom) => (
                    <option key={`${bom.bomId}-${bom.versionNo}`} value={bom.bomId}>
                      BoM #{bom.bomId} (v{bom.versionNo})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">
                User <span className="text-red-500">*</span>
              </label>
              <select
                value={form.raisedById}
                onChange={updateField('raisedById')}
                disabled={!isAdmin || disableInputs}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
              >
                <option value="">Select user</option>
                {users.map((userOption) => (
                  <option key={userOption.id} value={userOption.id}>
                    {userOption.name} ({userOption.loginId})
                  </option>
                ))}
              </select>
              {!isAdmin && (
                <p className="mt-1 text-xs text-gray-500">
                  Raised by is locked to your account.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Effective Date</label>
              <input
                type="datetime-local"
                value={form.effectiveDate}
                onChange={updateField('effectiveDate')}
                disabled={disableInputs}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Auto-populated when ECO is done.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                id="versionUpdate"
                type="checkbox"
                checked={form.versionUpdate}
                onChange={updateField('versionUpdate')}
                disabled={disableInputs}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="versionUpdate" className="text-sm text-gray-700">
                Version Update (create a new version on approval)
              </label>
            </div>
          </div>

          {started && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              This ECO is now in progress. Draft edits are locked.
            </div>
          )}
        </div>
      </div>

      {showCloseConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Start ECO before closing?</h3>
            <p className="mt-2 text-sm text-gray-600">
              You saved this ECO as a draft but haven&apos;t started it yet. You can start it now
              or close and leave it in draft.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-300"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={handleCloseAnyway}
                className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-300"
              >
                Close draft
              </button>
              <button
                type="button"
                onClick={handleConfirmStart}
                disabled={disableStart}
                className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                Start ECO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EcoCreateModal;
