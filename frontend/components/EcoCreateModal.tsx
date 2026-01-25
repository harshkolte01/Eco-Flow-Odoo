'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { EcoChangesView } from './EcoChangesView';

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
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

export function EcoCreateModal({ isOpen, onClose, currentUser, onComplete, initialEcoId }: EcoCreateModalProps) {
  const router = useRouter();
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
  const [eco, setEco] = useState<any>(null);
  const autoCreatedRef = useRef(false);
  const autoCreatePromiseRef = useRef<Promise<number | null> | null>(null);
  const manualCreateRef = useRef(false);
  const [reviewTab, setReviewTab] = useState<'approval' | 'changes'>('changes');
  const changesRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const canEdit = currentUser?.role === 'engineering' || currentUser?.role === 'admin';
  const canApprove = currentUser?.role === 'approver' || currentUser?.role === 'admin';

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
    setEco(null);
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
    autoCreatedRef.current = !!initialEcoId;
    autoCreatePromiseRef.current = null;
    manualCreateRef.current = false;
    setReviewTab('changes');
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
    if (started) {
      setReviewTab('changes');
    }
  }, [isOpen, started]);

  useEffect(() => {
    if (!isOpen || !initialEcoId) {
      return;
    }

    const loadEco = async () => {
      setLoadingOptions(true);
      try {
        const response = await apiFetch<{ eco: any }>(`/api/ecos/${initialEcoId}`);
        const ecoData = response.data?.eco;

        if (ecoData) {
          setEco(ecoData);
          setStarted(ecoData.status !== 'draft');
          setForm((prev) => ({
            ...prev,
            title: ecoData.title,
            ecoType: ecoData.ecoType,
            productId: String(ecoData.product?.id || ''),
            bomId: String(ecoData.bom?.id || ''),
            raisedById: String(ecoData.raisedBy?.id || ''),
            effectiveDate: ecoData.effectiveDate ? new Date(ecoData.effectiveDate).toISOString().slice(0, 16) : '',
            versionUpdate: ecoData.versionUpdate
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
    const activeEcoId = ecoId ?? initialEcoId ?? null;
    if (!isOpen || !activeEcoId || started) {
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
          }>(`/api/ecos/${activeEcoId}/draft/product`);

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
          }>(`/api/ecos/${activeEcoId}/draft/bom`);

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
  }, [ecoId, initialEcoId, form.ecoType, form.productId, form.bomId, isOpen, started]);

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
    if (!isOpen || started || ecoId || initialEcoId || autoCreatedRef.current || autoCreating) {
      return;
    }

    if (manualCreateRef.current) {
      return;
    }

    if (!autoCreateReady) {
      return;
    }

    if (autoCreatePromiseRef.current) {
      return;
    }

    const autoCreate = async () => {
      setAutoCreating(true);
      setAutoCreateError(null);
      const payload = buildPayload();
      const createPromise = apiFetch<{ eco: { id: number } }>('/api/ecos', {
        method: 'POST',
        body: payload
      })
        .then((response) => {
          const createdEcoId = response.data?.eco?.id ?? null;
          if (createdEcoId) {
            setEcoId(createdEcoId);
            autoCreatedRef.current = true;
          }
          return createdEcoId;
        })
        .catch((error) => {
          const messageText =
            error instanceof ApiError ? error.message : 'Failed to create draft ECO';
          setAutoCreateError(messageText);
          return null;
        })
        .finally(() => {
          autoCreatePromiseRef.current = null;
          setAutoCreating(false);
        });

      autoCreatePromiseRef.current = createPromise;
      await createPromise;
    };

    autoCreate();
  }, [autoCreateReady, autoCreating, ecoId, initialEcoId, isOpen, started]);

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
    if (manualCreateRef.current) {
      return;
    }

    manualCreateRef.current = true;
    setSubmitting(true);
    setMessage(null);

    try {
      const payload = buildPayload();

      let workingEcoId = ecoId ?? initialEcoId ?? null;

      if (!workingEcoId && autoCreatePromiseRef.current) {
        workingEcoId = await autoCreatePromiseRef.current;
      }

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
        if (!ecoId && workingEcoId) {
          setEcoId(workingEcoId);
        }
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
      manualCreateRef.current = false;
    }
  };

  const handleStart = async () => {
    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return false;
    }
    if (manualCreateRef.current) {
      return false;
    }

    manualCreateRef.current = true;
    setSubmitting(true);
    setMessage(null);

    try {
      let workingEcoId = ecoId ?? initialEcoId ?? null;
      const payload = buildPayload();

      if (!workingEcoId && autoCreatePromiseRef.current) {
        workingEcoId = await autoCreatePromiseRef.current;
      }

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
        if (!ecoId && workingEcoId) {
          setEcoId(workingEcoId);
        }
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
      manualCreateRef.current = false;
    }
  };

  const handleApprove = async () => {
    const workingEcoId = ecoId ?? initialEcoId;
    if (!workingEcoId) return;

    setSubmitting(true);
    setMessage(null);
    try {
      await apiFetch(`/api/ecos/${workingEcoId}/approve`, { method: 'POST' });
      setMessage({ type: 'success', text: 'ECO approved successfully.' });
      onComplete?.();
      onClose();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof ApiError ? error.message : 'Failed to approve ECO' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async () => {
    const workingEcoId = ecoId ?? initialEcoId;
    if (!workingEcoId) return;

    setSubmitting(true);
    setMessage(null);
    try {
      await apiFetch(`/api/ecos/${workingEcoId}/validate`, { method: 'POST' });
      setMessage({ type: 'success', text: 'ECO validated successfully.' });
      onComplete?.();
      onClose();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof ApiError ? error.message : 'Failed to validate ECO' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    const workingEcoId = ecoId ?? initialEcoId;
    if (!workingEcoId) return;

    setSubmitting(true);
    setMessage(null);
    try {
      await apiFetch(`/api/ecos/${workingEcoId}/reject`, { method: 'POST' });
      setMessage({ type: 'success', text: 'ECO rejected and moved back to draft.' });
      onComplete?.();
      onClose();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof ApiError ? error.message : 'Failed to reject ECO' });
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

  const scrollToChanges = () => {
    if (changesRef.current) {
      changesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleShowChanges = () => {
    setReviewTab('changes');
    requestAnimationFrame(scrollToChanges);
  };

  const handleShowApproval = () => {
    setReviewTab('approval');
  };

  const handleOpenSource = () => {
    if (!form.ecoType || !form.productId) {
      return;
    }
    const selectedProduct = products.find(
      (product) => String(product.productId) === form.productId
    );
    const searchValue = selectedProduct?.productCode || selectedProduct?.productName;
    const params = new URLSearchParams();
    if (searchValue) {
      params.set('q', searchValue);
    }
    const target = form.ecoType === 'bom' ? '/boms' : '/products';
    const path = params.toString() ? `${target}?${params.toString()}` : target;
    router.push(path);
  };

  const disableInputs = submitting || started || !canEdit;
  const disableSave = disableInputs || isSaved;
  const disableStart = disableInputs || !isSaved;
  const disableDraftInputs = disableInputs || !ecoId;
  const disableStructuralInputs = disableInputs || isSaved;
  const canOpenSource = Boolean(form.ecoType && form.productId);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-900/5">
        <div className="flex flex-col gap-6 border-b border-gray-100 px-8 py-6 sm:flex-row sm:items-start sm:justify-between bg-white">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                ECO
              </span>
              <span className="text-xs font-medium text-gray-500">
                {eco?.status === 'applied' ? 'Applied' : initialEcoId ? 'Details' : 'Draft'}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              {eco?.status === 'applied' ? 'ECO Applied' : initialEcoId ? 'ECO Details' : 'New Change Order'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Current Stage: <span className="font-medium text-gray-900">{eco?.currentStage?.name || 'New'}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {started && eco?.status === 'in_progress' && canApprove && (
              <>
                {eco?.currentStage?.approvalRequired ? (
                  <>
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={submitting}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={submitting}
                      className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 shadow-sm ring-1 ring-inset ring-rose-300 hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={submitting}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Validate
                  </button>
                )}
              </>
            )}
            {started && eco?.status === 'in_progress' && !canApprove && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                Awaiting approval
              </span>
            )}
            {!started && canEdit && (
              <button
                type="button"
                onClick={handleStart}
                disabled={disableStart}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Start Process
              </button>
            )}
            {!started && canEdit && (
              <button
                type="button"
                onClick={handleSave}
                disabled={disableSave}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Draft
              </button>
            )}
            <button
              type="button"
              onClick={handleCloseRequest}
              disabled={submitting}
              className="rounded-xl p-2.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-all"
              title="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          {message && (
            <div
              className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                message.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {started && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleShowApproval}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  reviewTab === 'approval'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:border-emerald-200 hover:text-emerald-700'
                }`}
              >
                Approval
              </button>
              <button
                type="button"
                onClick={handleOpenSource}
                disabled={!canOpenSource}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                {form.ecoType === 'bom' ? 'Open Bill of Materials' : 'Open Product'}
              </button>
              <button
                type="button"
                onClick={handleShowChanges}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  reviewTab === 'changes'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:border-emerald-200 hover:text-emerald-700'
                }`}
              >
                Changes
              </button>
            </div>
          )}

          {loadingOptions ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="sm:col-span-2 pt-4 flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={updateField('title')}
                  disabled={disableStructuralInputs}
                  placeholder="Enter a descriptive title for this ECO..."
                  className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  ECO Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.ecoType}
                  onChange={handleEcoTypeChange}
                  disabled={disableStructuralInputs}
                  className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Select ECO type</option>
                  <option value="product">Product</option>
                  <option value="bom">Bills of Materials</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.productId}
                  onChange={handleProductChange}
                  disabled={disableStructuralInputs}
                  className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:text-gray-500"
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
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 block">
                    Bill of Materials <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.bomId}
                    onChange={updateField('bomId')}
                    disabled={disableStructuralInputs || !form.productId}
                    className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:text-gray-500"
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
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  User <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.raisedById}
                  onChange={updateField('raisedById')}
                  disabled={!isAdmin || disableStructuralInputs}
                  className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Select user</option>
                  {users.map((userOption) => (
                    <option key={userOption.id} value={userOption.id}>
                      {userOption.name} ({userOption.loginId})
                    </option>
                  ))}
                </select>
                {!isAdmin && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    Raised by is locked to your account.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 block">Effective Date</label>
                <input
                  type="datetime-local"
                  value={form.effectiveDate}
                  onChange={updateField('effectiveDate')}
                  disabled={disableInputs}
                  className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:text-gray-500"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Auto-populated when ECO is done.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 sm:col-span-2">
                <input
                  id="versionUpdate"
                  type="checkbox"
                  checked={form.versionUpdate}
                  onChange={updateField('versionUpdate')}
                  disabled={disableInputs}
                  className="h-5 w-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="versionUpdate" className="text-sm font-medium text-gray-700">
                  Version Update <span className="font-normal text-gray-500">(create a new version on approval)</span>
                </label>
              </div>
            </div>
          )}

          <div ref={changesRef} className="mt-8 border-t border-gray-100 pt-8">
            {started ? (
              <div className="space-y-4">
                {reviewTab === 'approval' && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-5 py-4 text-sm text-emerald-800">
                    Review the header fields above and the proposed changes before approving. Use the action
                    buttons in the header to approve, validate, or reject this ECO.
                  </div>
                )}
                {reviewTab === 'changes' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">Proposed Changes</h3>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        Review Mode
                      </span>
                    </div>
                    {(ecoId || initialEcoId) && (
                      <EcoChangesView
                        ecoId={ecoId ?? initialEcoId!}
                        ecoType={form.ecoType as 'product' | 'bom'}
                      />
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-gray-50/30 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Draft Changes</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Update the draft details for the selected ECO type.
                    </p>
                  </div>
                  {draftTouched && (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      Unsaved changes
                    </span>
                  )}
                </div>

                {!ecoId && (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-white/50">
                    <p className="text-sm font-medium text-gray-500">
                      Save the ECO details above to start editing changes.
                    </p>
                  </div>
                )}

                {autoCreateError && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {autoCreateError}
                  </div>
                )}

                {draftError && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {draftError}
                  </div>
                )}

                {draftLoading ? (
                  <div className="mt-6 space-y-6">
                    {form.ecoType === 'product' ? (
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="sm:col-span-2 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-11 w-full rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-11 w-full rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-11 w-full rounded-xl" />
                        </div>
                        <div className="sm:col-span-2 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-24 w-full rounded-xl" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                         {/* Keeping existing skeleton structure but updated classes */}
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-24" />
                          <div className="rounded-xl border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                              <div className="grid grid-cols-12 gap-4">
                                <Skeleton className="col-span-8 h-4 w-16" />
                                <Skeleton className="col-span-4 h-4 w-12" />
                              </div>
                            </div>
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-8 space-y-2">
                                  <Skeleton className="h-5 w-32" />
                                  <Skeleton className="h-4 w-16" />
                                </div>
                                <Skeleton className="col-span-4 h-9 w-full rounded-lg" />
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
                      <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 block">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={productDraft.newProductName}
                        onChange={updateProductDraftField('newProductName')}
                        disabled={disableDraftInputs}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 block">Sale Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productDraft.newSalePrice}
                        onChange={updateProductDraftField('newSalePrice')}
                        disabled={disableDraftInputs}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 block">Cost Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productDraft.newCostPrice}
                        onChange={updateProductDraftField('newCostPrice')}
                        disabled={disableDraftInputs}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-50"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 block">Attachments</label>
                      <textarea
                        value={productDraft.newAttachments}
                        onChange={updateProductDraftField('newAttachments')}
                        disabled={disableDraftInputs}
                        rows={3}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                )}

                {form.ecoType === 'bom' && (
                  <div className="mt-6 space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                        Components
                      </h4>
                      {bomDraft.components.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No components available.</p>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                          <div className="grid grid-cols-12 gap-4 bg-gray-50 px-4 py-3 text-[11px] font-semibold uppercase text-gray-500 border-b border-gray-100">
                            <div className="col-span-8">Component</div>
                            <div className="col-span-4">Quantity</div>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {bomDraft.components.map((component, index) => (
                              <div
                                key={`${component.componentProductVersionId}-${index}`}
                                className="flex flex-col sm:grid sm:grid-cols-12 gap-3 px-4 py-3 text-sm text-gray-700 items-center"
                              >
                                <div className="col-span-8 w-full">
                                  <div className="font-medium text-gray-900 leading-tight">
                                    {component.productName}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5 font-mono">{component.productCode}</div>
                                </div>
                                <div className="col-span-4 flex items-center w-full">
                                  <span className="sm:hidden text-xs font-medium text-gray-500 mr-2">Qty:</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={component.quantity}
                                    onChange={(event) =>
                                      updateBomComponent(index, event.target.value)
                                    }
                                    disabled={disableDraftInputs}
                                    className="w-full rounded-lg border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 transition-all focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-50"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Operations
                        </h4>
                        <button
                          type="button"
                          onClick={addBomOperation}
                          disabled={disableDraftInputs}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Operation
                        </button>
                      </div>
                      {bomDraft.operations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-white/50">
                          <p className="text-sm font-medium text-gray-400">No operations added yet</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                          <div className="hidden sm:grid grid-cols-12 gap-4 bg-gray-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100">
                            <div className="col-span-5">Operation</div>
                            <div className="col-span-3">Work Center</div>
                            <div className="col-span-4 text-right pr-12">Minutes</div>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {bomDraft.operations.map((operation, index) => (
                              <div
                                key={operation.localId}
                                className="flex flex-col sm:grid sm:grid-cols-12 gap-4 px-4 py-4 sm:py-3 text-sm text-gray-700 hover:bg-gray-50/50 transition-colors items-center"
                              >
                                <div className="col-span-5 w-full">
                                  <span className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">Operation Name</span>
                                  <input
                                    type="text"
                                    value={operation.operationName}
                                    placeholder="e.g. Assembly"
                                    onChange={(event) =>
                                      updateBomOperation(index, 'operationName', event.target.value)
                                    }
                                    disabled={disableDraftInputs}
                                    className="w-full rounded-lg border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 transition-all focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-50"
                                  />
                                </div>
                                <div className="col-span-3 w-full">
                                  <span className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">Work Center</span>
                                  <input
                                    type="text"
                                    value={operation.workCenter}
                                    placeholder="e.g. WC-01"
                                    onChange={(event) =>
                                      updateBomOperation(index, 'workCenter', event.target.value)
                                    }
                                    disabled={disableDraftInputs}
                                    className="w-full rounded-lg border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 transition-all focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-50"
                                  />
                                </div>
                                <div className="col-span-4 w-full">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                      <span className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">Minutes</span>
                                      <input
                                        type="number"
                                        value={operation.timeMinutes}
                                        placeholder="0"
                                        onChange={(event) =>
                                          updateBomOperation(index, 'timeMinutes', event.target.value)
                                        }
                                        disabled={disableDraftInputs}
                                        className="w-full rounded-lg border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 transition-all focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-50"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeBomOperation(index)}
                                      disabled={disableDraftInputs}
                                      className="mt-5 sm:mt-0 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Remove operation"
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
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
            )}
          </div>

          {started && (
            <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              This ECO is now in progress. Draft edits are locked.
            </div>
          )}
        </div>
      </div>

      {showCloseConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
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
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-300"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={handleCloseAnyway}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-300"
              >
                Close draft
              </button>
              <button
                type="button"
                onClick={handleConfirmStart}
                disabled={disableStart}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
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
