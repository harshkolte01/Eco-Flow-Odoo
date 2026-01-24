'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  initialEcoId?: number | null;
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

interface ProductDraftState {
  newProductName: string;
  newSalePrice: string;
  newCostPrice: string;
  newAttachments: string;
}

interface BomDraftComponent {
  componentProductVersionId: number;
  productCode: string;
  productName: string;
  quantity: string;
}

interface BomDraftOperation {
  localId: string;
  operationName: string;
  timeMinutes: string;
  workCenter: string;
}

type BomDraftOperationField = 'operationName' | 'timeMinutes' | 'workCenter';

interface BomDraftState {
  components: BomDraftComponent[];
  operations: BomDraftOperation[];
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

const emptyProductDraft: ProductDraftState = {
  newProductName: '',
  newSalePrice: '',
  newCostPrice: '',
  newAttachments: ''
};

const emptyBomDraft: BomDraftState = {
  components: [],
  operations: []
};

const createLocalId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
);

export function EcoCreateModal({ isOpen, onClose, currentUser, onComplete, initialEcoId }: EcoCreateModalProps) {
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
  const [productDraft, setProductDraft] = useState<ProductDraftState>(emptyProductDraft);
  const [bomDraft, setBomDraft] = useState<BomDraftState>(emptyBomDraft);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftTouched, setDraftTouched] = useState(false);
  const [autoCreateError, setAutoCreateError] = useState<string | null>(null);
  const [autoCreating, setAutoCreating] = useState(false);
  const autoCreatedRef = useRef(false);

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
    setEcoId(initialEcoId ?? null);
    setMessage(null);
    setStarted(false);
    setIsSaved(!!initialEcoId);
    setShowCloseConfirm(false);
    setProductDraft(emptyProductDraft);
    setBomDraft(emptyBomDraft);
    setDraftLoading(false);
    setDraftError(null);
    setDraftTouched(false);
    setAutoCreateError(null);
    setAutoCreating(false);
    autoCreatedRef.current = false;
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetForm();
  }, [isOpen, currentUserId]);

  useEffect(() => {
    if (!isOpen || !initialEcoId) {
      return;
    }

    const loadEco = async () => {
      setLoadingOptions(true);
      try {
        const response = await apiFetch<{ eco: any }>(`/api/ecos/${initialEcoId}`);
        const eco = response.data?.eco;

        if (eco) {
          setForm((prev) => ({
            ...prev,
            title: eco.title,
            ecoType: eco.ecoType,
            productId: String(eco.product?.id || ''),
            bomId: String(eco.bom?.id || ''),
            raisedById: String(eco.raisedBy?.id || ''),
            effectiveDate: eco.effectiveDate ? new Date(eco.effectiveDate).toISOString().slice(0, 16) : '',
            versionUpdate: eco.versionUpdate
          }));
        }
      } catch (error) {
        const messageText =
          error instanceof ApiError ? error.message : 'Failed to load ECO details';
        setMessage({ type: 'error', text: messageText });
      } finally {
        setLoadingOptions(false);
      }
    };

    loadEco();
  }, [isOpen, initialEcoId]);

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

  useEffect(() => {
    if (!isOpen || !ecoId || started) {
      return;
    }

    const loadDraft = async () => {
      if (form.ecoType === 'product') {
        if (!form.productId) {
          setProductDraft(emptyProductDraft);
          return;
        }
        setDraftLoading(true);
        setDraftError(null);
        try {
          const response = await apiFetch<{
            draft: {
              base: {
                productName: string | null;
                salePrice: string | number | null;
                costPrice: string | number | null;
                attachments: string | object | null;
              };
              draft: {
                newProductName: string | null;
                newSalePrice: string | number | null;
                newCostPrice: string | number | null;
                newAttachments: string | object | null;
              };
            };
          }>(`/api/ecos/${ecoId}/draft/product`);

          const base = response.data?.draft?.base;
          const draft = response.data?.draft?.draft;

          const formatValue = (value: unknown) => {
            if (value === null || value === undefined) {
              return '';
            }
            if (typeof value === 'string' || typeof value === 'number') {
              return String(value);
            }
            return JSON.stringify(value);
          };

          setProductDraft({
            newProductName: formatValue(draft?.newProductName ?? base?.productName),
            newSalePrice: formatValue(draft?.newSalePrice ?? base?.salePrice),
            newCostPrice: formatValue(draft?.newCostPrice ?? base?.costPrice),
            newAttachments: formatValue(draft?.newAttachments ?? base?.attachments)
          });
          setDraftTouched(false);
        } catch (error) {
          const messageText =
            error instanceof ApiError ? error.message : 'Failed to load product draft';
          setDraftError(messageText);
        } finally {
          setDraftLoading(false);
        }
      }

      if (form.ecoType === 'bom') {
        if (!form.bomId) {
          setBomDraft(emptyBomDraft);
          return;
        }
        setDraftLoading(true);
        setDraftError(null);
        try {
          const response = await apiFetch<{
            draft: {
              components: Array<{
                componentProductVersionId: number;
                productCode: string;
                productName: string;
                quantity: string | number;
              }>;
              operations: Array<{
                operationName: string;
                timeMinutes: number | string;
                workCenter: string | null;
              }>;
            };
          }>(`/api/ecos/${ecoId}/draft/bom`);

          setBomDraft({
            components:
              response.data?.draft?.components.map((component) => ({
                componentProductVersionId: component.componentProductVersionId,
                productCode: component.productCode,
                productName: component.productName,
                quantity: String(component.quantity ?? '')
              })) ?? [],
            operations:
              response.data?.draft?.operations.map((operation) => ({
                localId: createLocalId(),
                operationName: operation.operationName ?? '',
                timeMinutes: String(operation.timeMinutes ?? ''),
                workCenter: operation.workCenter ?? ''
              })) ?? []
          });
          setDraftTouched(false);
        } catch (error) {
          const messageText =
            error instanceof ApiError ? error.message : 'Failed to load BoM draft';
          setDraftError(messageText);
        } finally {
          setDraftLoading(false);
        }
      }
    };

    loadDraft();
  }, [ecoId, form.ecoType, form.productId, form.bomId, isOpen, started]);

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
    setProductDraft(emptyProductDraft);
    setBomDraft(emptyBomDraft);
    setDraftError(null);
    setDraftTouched(false);
    if (!isSaved) {
      setEcoId(null);
      autoCreatedRef.current = false;
    }
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
    setProductDraft(emptyProductDraft);
    setBomDraft(emptyBomDraft);
    setDraftError(null);
    setDraftTouched(false);
    if (!isSaved) {
      setEcoId(null);
      autoCreatedRef.current = false;
    }
    if (isSaved && !started) {
      setIsSaved(false);
    }
    setMessage(null);
  };

  const updateProductDraftField = (field: keyof ProductDraftState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setProductDraft((prev) => ({
        ...prev,
        [field]: value
      }));
      setDraftTouched(true);
      if (isSaved && !started) {
        setIsSaved(false);
      }
    };

  const updateBomComponent = (index: number, value: string) => {
    setBomDraft((prev) => {
      const nextComponents = [...prev.components];
      nextComponents[index] = {
        ...nextComponents[index],
        quantity: value
      };
      return { ...prev, components: nextComponents };
    });
    setDraftTouched(true);
    if (isSaved && !started) {
      setIsSaved(false);
    }
  };

  const updateBomOperation = (
    index: number,
    field: BomDraftOperationField,
    value: string
  ) => {
    setBomDraft((prev) => {
      const nextOperations = [...prev.operations];
      nextOperations[index] = {
        ...nextOperations[index],
        [field]: value
      };
      return { ...prev, operations: nextOperations };
    });
    setDraftTouched(true);
    if (isSaved && !started) {
      setIsSaved(false);
    }
  };

  const addBomOperation = () => {
    setBomDraft((prev) => ({
      ...prev,
      operations: [
        ...prev.operations,
        {
          localId: createLocalId(),
          operationName: '',
          timeMinutes: '',
          workCenter: ''
        }
      ]
    }));
    setDraftTouched(true);
    if (isSaved && !started) {
      setIsSaved(false);
    }
  };

  const removeBomOperation = (index: number) => {
    setBomDraft((prev) => ({
      ...prev,
      operations: prev.operations.filter((_, opIndex) => opIndex !== index)
    }));
    setDraftTouched(true);
    if (isSaved && !started) {
      setIsSaved(false);
    }
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

  const autoCreateReady =
    form.title.trim() &&
    form.ecoType &&
    form.productId &&
    (form.ecoType !== 'bom' || form.bomId);

  useEffect(() => {
    if (!isOpen || started || ecoId || autoCreatedRef.current || autoCreating) {
      return;
    }

    if (!autoCreateReady) {
      return;
    }

    const autoCreate = async () => {
      setAutoCreating(true);
      setAutoCreateError(null);
      try {
        const payload = buildPayload();
        const response = await apiFetch<{ eco: { id: number } }>('/api/ecos', {
          method: 'POST',
          body: payload
        });
        const createdEcoId = response.data?.eco?.id ?? null;
        if (createdEcoId) {
          setEcoId(createdEcoId);
          autoCreatedRef.current = true;
        }
      } catch (error) {
        const messageText =
          error instanceof ApiError ? error.message : 'Failed to create draft ECO';
        setAutoCreateError(messageText);
      } finally {
        setAutoCreating(false);
      }
    };

    autoCreate();
  }, [autoCreateReady, autoCreating, ecoId, isOpen, started]);

  const saveDraftChanges = async (workingEcoId: number) => {
    if (!draftTouched) {
      return;
    }

    if (form.ecoType === 'product') {
      await apiFetch(`/api/ecos/${workingEcoId}/draft/product`, {
        method: 'PUT',
        body: {
          newProductName: productDraft.newProductName,
          newSalePrice: productDraft.newSalePrice,
          newCostPrice: productDraft.newCostPrice,
          newAttachments: productDraft.newAttachments
        }
      });
      setDraftTouched(false);
      return;
    }

    if (form.ecoType === 'bom' && form.bomId) {
      const invalidOperation = bomDraft.operations.find(
        (operation) =>
          !String(operation.operationName).trim() ||
          operation.timeMinutes === '' ||
          Number.isNaN(Number(operation.timeMinutes))
      );

      if (invalidOperation) {
        setDraftError('Fill operation name and minutes for all operations.');
        throw new Error('Draft operations are incomplete.');
      }

      await apiFetch(`/api/ecos/${workingEcoId}/draft/bom`, {
        method: 'PUT',
        body: {
          components: bomDraft.components.map((component) => ({
            componentProductVersionId: component.componentProductVersionId,
            quantity: component.quantity
          })),
          operations: bomDraft.operations.map((operation) => ({
            operationName: operation.operationName,
            timeMinutes: operation.timeMinutes,
            workCenter: operation.workCenter
          }))
        }
      });
      setDraftTouched(false);
    }
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

      let workingEcoId = ecoId;

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

      if (workingEcoId) {
        await saveDraftChanges(workingEcoId);
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
  const disableDraftInputs = disableInputs || !ecoId;
  const disableStructuralInputs = disableInputs || isSaved;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 sm:p-6">
      <div className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-xl border border-gray-200">
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

        <div className="flex-1 overflow-y-auto px-6 py-5">
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

          {loadingOptions ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="sm:col-span-2 pt-6 flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={updateField('title')}
                  disabled={disableStructuralInputs}
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
                  disabled={disableStructuralInputs}
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
                  disabled={disableStructuralInputs}
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
                    disabled={disableStructuralInputs || !form.productId}
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
                  disabled={!isAdmin || disableStructuralInputs}
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
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
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
          )}

          <div className="mt-6 border-t border-gray-200 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Draft Changes</h3>
                <p className="text-xs text-gray-500">
                  Update the draft details for the selected ECO type.
                </p>
              </div>
              {draftTouched && (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                  Unsaved changes
                </span>
              )}
            </div>

            {!ecoId && (
              <p className="mt-3 text-xs text-gray-500">
                Save the ECO first to load and edit draft changes.
              </p>
            )}

            {autoCreateError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {autoCreateError}
              </div>
            )}

            {draftError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {draftError}
              </div>
            )}

            {draftLoading ? (
              <div className="mt-4 space-y-6">
                {form.ecoType === 'product' ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-24" />
                      <div className="rounded-md border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <div className="grid grid-cols-12 gap-2">
                            <Skeleton className="col-span-8 h-3 w-16" />
                            <Skeleton className="col-span-4 h-3 w-12" />
                          </div>
                        </div>
                        <div className="p-3 space-y-3">
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-8 space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="col-span-4 h-8 w-full" />
                          </div>
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-8 space-y-1">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="col-span-4 h-8 w-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <div className="rounded-md border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <div className="grid grid-cols-12 gap-2">
                            <Skeleton className="col-span-5 h-3 w-16" />
                            <Skeleton className="col-span-3 h-3 w-16" />
                            <Skeleton className="col-span-4 h-3 w-12" />
                          </div>
                        </div>
                        <div className="p-3 space-y-3">
                          <div className="grid grid-cols-12 gap-2">
                            <Skeleton className="col-span-5 h-8 w-full" />
                            <Skeleton className="col-span-3 h-8 w-full" />
                            <Skeleton className="col-span-4 h-8 w-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {form.ecoType === 'product' && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productDraft.newProductName}
                    onChange={updateProductDraftField('newProductName')}
                    disabled={disableDraftInputs}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Sale Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productDraft.newSalePrice}
                    onChange={updateProductDraftField('newSalePrice')}
                    disabled={disableDraftInputs}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productDraft.newCostPrice}
                    onChange={updateProductDraftField('newCostPrice')}
                    disabled={disableDraftInputs}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Attachments</label>
                  <textarea
                    value={productDraft.newAttachments}
                    onChange={updateProductDraftField('newAttachments')}
                    disabled={disableDraftInputs}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            )}

            {form.ecoType === 'bom' && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Components
                  </h4>
                  {bomDraft.components.length === 0 ? (
                    <p className="mt-2 text-xs text-gray-500">No components available.</p>
                  ) : (
                    <div className="mt-2 overflow-hidden rounded-md border border-gray-200">
                      <div className="grid grid-cols-12 gap-2 bg-gray-50 px-3 py-2 text-[11px] font-semibold uppercase text-gray-500">
                        <div className="col-span-8">Component</div>
                        <div className="col-span-4">Quantity</div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {bomDraft.components.map((component, index) => (
                          <div
                            key={`${component.componentProductVersionId}-${index}`}
                            className="grid grid-cols-12 gap-2 px-3 py-2 text-sm text-gray-700"
                          >
                            <div className="col-span-8">
                              <div className="font-semibold text-gray-900">
                                {component.productName}
                              </div>
                              <div className="text-xs text-gray-500">{component.productCode}</div>
                            </div>
                            <div className="col-span-4">
                              <input
                                type="number"
                                step="0.01"
                                value={component.quantity}
                                onChange={(event) =>
                                  updateBomComponent(index, event.target.value)
                                }
                                disabled={disableDraftInputs}
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Operations
                    </h4>
                    <button
                      type="button"
                      onClick={addBomOperation}
                      disabled={disableDraftInputs}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:border-emerald-300 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Add Operation
                    </button>
                  </div>
                  {bomDraft.operations.length === 0 ? (
                    <p className="mt-2 text-xs text-gray-500">No operations available.</p>
                  ) : (
                    <div className="mt-2 overflow-hidden rounded-md border border-gray-200">
                      <div className="grid grid-cols-12 gap-2 bg-gray-50 px-3 py-2 text-[11px] font-semibold uppercase text-gray-500">
                        <div className="col-span-5">Operation</div>
                        <div className="col-span-3">Work Center</div>
                        <div className="col-span-4">Minutes</div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {bomDraft.operations.map((operation, index) => (
                          <div
                            key={operation.localId}
                            className="grid grid-cols-12 gap-2 px-3 py-2 text-sm text-gray-700"
                          >
                            <div className="col-span-5">
                              <input
                                type="text"
                                value={operation.operationName}
                                onChange={(event) =>
                                  updateBomOperation(index, 'operationName', event.target.value)
                                }
                                disabled={disableDraftInputs}
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
                              />
                            </div>
                            <div className="col-span-3">
                              <input
                                type="text"
                                value={operation.workCenter}
                                onChange={(event) =>
                                  updateBomOperation(index, 'workCenter', event.target.value)
                                }
                                disabled={disableDraftInputs}
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
                              />
                            </div>
                            <div className="col-span-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={operation.timeMinutes}
                                  onChange={(event) =>
                                    updateBomOperation(index, 'timeMinutes', event.target.value)
                                  }
                                  disabled={disableDraftInputs}
                                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeBomOperation(index)}
                                  disabled={disableDraftInputs}
                                  className="rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-500 hover:border-gray-300 disabled:cursor-not-allowed disabled:text-gray-300"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
              </>
            )}
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
