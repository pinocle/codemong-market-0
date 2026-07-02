import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  PackagePlus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

type Product = {
  id: number;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
};

type ApiError = {
  message?: string;
};

type Notice = {
  tone: 'success' | 'error';
  text: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    let message = '요청 처리에 실패했습니다.';
    try {
      const body = (await response.json()) as ApiError;
      message = body.message || message;
    } catch {
      if (response.status === 404) {
        message = '상품을 찾을 수 없습니다.';
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function imageSrc(imageUrl: string | null) {
  if (!imageUrl) {
    return '';
  }
  return `${API_BASE}${imageUrl}`;
}

function money(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

function productFormData(product: { name: string; price: number; description: string }, image: File) {
  const formData = new FormData();
  formData.append(
    'product',
    new Blob([JSON.stringify(product)], { type: 'application/json' }),
    'product.json',
  );
  formData.append('image', image);
  return formData;
}

function imageFormData(image: File) {
  const formData = new FormData();
  formData.append('image', image);
  return formData;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const selectedProduct = products.find((product) => product.id === selectedId) ?? products[0] ?? null;
  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return products;
    }
    return products.filter((product) =>
      [product.name, product.description ?? '', String(product.price)].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [products, query]);

  async function loadProducts(nextSelectedId?: number) {
    setLoading(true);
    try {
      const data = await request<Product[]>('/api/products');
      setProducts(data);
      setSelectedId(nextSelectedId ?? data[0]?.id ?? null);
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : '상품 목록을 불러오지 못했습니다.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  async function handleCreated(product: Product) {
    setNotice({ tone: 'success', text: '상품이 등록되었습니다.' });
    await loadProducts(product.id);
  }

  async function handleImageUpdated(product: Product) {
    setNotice({ tone: 'success', text: '대표 이미지가 교체되었습니다.' });
    await loadProducts(product.id);
  }

  async function handleDelete(productId: number) {
    const ok = window.confirm('상품을 삭제하시겠습니까?');
    if (!ok) {
      return;
    }

    try {
      await request<void>(`/api/products/${productId}`, { method: 'DELETE' });
      setNotice({ tone: 'success', text: '상품이 삭제되었습니다.' });
      await loadProducts();
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : '상품 삭제에 실패했습니다.' });
    }
  }

  return (
    <>
      <header className="app-header">
        <a className="brand" href="/">
          market
        </a>
        <div className="header-actions">
          <button className="icon-button" type="button" onClick={() => void loadProducts(selectedId ?? undefined)}>
            <RefreshCw size={18} />
            <span>새로고침</span>
          </button>
        </div>
      </header>

      <main className="app-shell">
        <section className="workspace">
          <ProductCreateForm onCreated={handleCreated} onError={(text) => setNotice({ tone: 'error', text })} />

          <div className="inventory">
            <div className="toolbar">
              <div>
                <h1>상품 관리</h1>
                <p>{products.length}개 상품</p>
              </div>
              <label className="search">
                <Search size={18} />
                <input
                  aria-label="상품 검색"
                  placeholder="상품 검색"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>

            {notice && (
              <p className={`notice ${notice.tone}`} role="alert">
                {notice.text}
              </p>
            )}

            {loading ? (
              <div className="empty" role="status">
                불러오는 중
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty">상품이 없습니다.</div>
            ) : (
              <ul className="product-grid">
                {filteredProducts.map((product) => (
                  <li key={product.id}>
                    <button
                      className={`product-tile ${selectedProduct?.id === product.id ? 'active' : ''}`}
                      type="button"
                      onClick={() => setSelectedId(product.id)}
                    >
                      {product.imageUrl ? (
                        <img src={imageSrc(product.imageUrl)} alt={product.name} />
                      ) : (
                        <span className="image-placeholder">
                          <Camera size={28} />
                        </span>
                      )}
                      <span className="tile-body">
                        <strong>{product.name}</strong>
                        <span>{money(product.price)}원</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="detail-pane">
          {selectedProduct ? (
            <ProductDetail
              product={selectedProduct}
              onImageUpdated={handleImageUpdated}
              onDelete={handleDelete}
              onError={(text) => setNotice({ tone: 'error', text })}
            />
          ) : (
            <div className="empty detail-empty">선택된 상품이 없습니다.</div>
          )}
        </aside>
      </main>
    </>
  );
}

function ProductCreateForm({
  onCreated,
  onError,
}: {
  onCreated: (product: Product) => Promise<void>;
  onError: (text: string) => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('39000');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const numericPrice = Number(price);
    if (!name.trim()) {
      onError('상품명을 입력하세요.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      onError('가격은 1원 이상이어야 합니다.');
      return;
    }
    if (!image) {
      onError('대표 이미지를 선택하세요.');
      return;
    }

    setSubmitting(true);
    try {
      const product = await request<Product>('/api/products/with-image', {
        method: 'POST',
        body: productFormData({ name, price: numericPrice, description }, image),
      });
      setName('');
      setPrice('39000');
      setDescription('');
      setImage(null);
      if (fileRef.current) {
        fileRef.current.value = '';
      }
      await onCreated(product);
    } catch (error) {
      onError(error instanceof Error ? error.message : '상품 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="create-panel">
      <div className="section-title">
        <PackagePlus size={20} />
        <h2>상품 등록</h2>
      </div>
      <form onSubmit={submit}>
        <label>
          상품명
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="후드티" />
        </label>
        <label>
          가격
          <input
            inputMode="numeric"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="39000"
          />
        </label>
        <label>
          설명
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="기본 후드티" />
        </label>
        <label className="file-input">
          <ImagePlus size={18} />
          <span>{image ? image.name : '대표 이미지 선택'}</span>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
        </label>
        <button className="primary-button" type="submit" disabled={submitting}>
          <Upload size={18} />
          <span>{submitting ? '등록 중' : '등록'}</span>
        </button>
      </form>
    </section>
  );
}

function ProductDetail({
  product,
  onImageUpdated,
  onDelete,
  onError,
}: {
  product: Product;
  onImageUpdated: (product: Product) => Promise<void>;
  onDelete: (productId: number) => Promise<void>;
  onError: (text: string) => void;
}) {
  const [image, setImage] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function updateImage() {
    if (!image) {
      onError('교체할 이미지를 선택하세요.');
      return;
    }

    setUpdating(true);
    try {
      const updated = await request<Product>(`/api/products/${product.id}/image`, {
        method: 'PUT',
        body: imageFormData(image),
      });
      setImage(null);
      if (fileRef.current) {
        fileRef.current.value = '';
      }
      await onImageUpdated(updated);
    } catch (error) {
      onError(error instanceof Error ? error.message : '이미지 교체에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <section className="detail-content">
      <div className="preview">
        {product.imageUrl ? (
          <img src={imageSrc(product.imageUrl)} alt={product.name} />
        ) : (
          <span className="image-placeholder large">
            <Camera size={40} />
          </span>
        )}
      </div>

      <div className="detail-header">
        <div>
          <h2>{product.name}</h2>
          <p>{money(product.price)}원</p>
        </div>
        <button className="danger-button" type="button" onClick={() => void onDelete(product.id)}>
          <Trash2 size={18} />
          <span>삭제</span>
        </button>
      </div>

      <p className="description">{product.description || '설명 없음'}</p>

      <div className="url-row">
        <CheckCircle2 size={18} />
        <span>{product.imageUrl || '이미지 없음'}</span>
      </div>

      <div className="replace-box">
        <label className="file-input compact">
          <ImagePlus size={18} />
          <span>{image ? image.name : '새 이미지 선택'}</span>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
        </label>
        <button className="secondary-button" type="button" onClick={() => void updateImage()} disabled={updating}>
          <RefreshCw size={18} />
          <span>{updating ? '교체 중' : '이미지 교체'}</span>
        </button>
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
