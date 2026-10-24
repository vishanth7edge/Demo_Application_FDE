import { useNavigate } from 'react-router'

import AlertDialog from '../components/AlertDialog.tsx'
import Button from '../components/Button.tsx'
import ImageUploader from '../components/products/ImageUploader.tsx'
import ProductFormFields from '../components/products/ProductFormFields.tsx'
import { useProductForm } from '../components/products/useProductForm.ts'

const FORM_ID = 'add-product-form'

export default function AddProductPage(): React.JSX.Element {
  const navigate = useNavigate()
  const form = useProductForm()

  const goToList = (): void => {
    void navigate('/products')
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        id={FORM_ID}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          form.submit()
        }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <section className="flex flex-col gap-4 self-start rounded-xl bg-surface p-5">
          <h1 className="border-b border-outline-variant pb-2 text-title-medium text-on-surface">
            Upload Product Image
          </h1>
          <ImageUploader />
        </section>
        <div className="rounded-xl bg-surface p-5">
          <ProductFormFields values={form.values} errors={form.errors} onChange={form.setField} />
        </div>
      </form>
      {form.submitError !== null && (
        <p role="alert" className="rounded-md bg-error-container p-3 text-on-error-container">
          {form.submitError}
        </p>
      )}
      {form.draftSaved && (
        <p role="status" className="text-body-medium text-on-surface-variant">
          Draft saved on this device.
        </p>
      )}
      <div className="sticky bottom-0 -mx-4 -mb-4 flex items-center justify-between gap-3 border-t border-outline-variant bg-surface px-4 py-3 md:-mx-6 md:-mb-6 md:px-6">
        <Button variant="outlined" onClick={goToList}>
          Cancel
        </Button>
        <div className="flex gap-3">
          <Button variant="outlined" onClick={form.saveDraft}>
            Save as draft
          </Button>
          <button
            type="submit"
            form={FORM_ID}
            disabled={form.isSubmitting}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-label-large text-on-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
          >
            {form.isSubmitting ? 'Adding…' : 'Add Product'}
          </button>
        </div>
      </div>
      {form.created && (
        <AlertDialog
          tone="success"
          title="Product Added Successfully"
          description="Your product was added. You can go back to the product list or return home."
          onClose={goToList}
          actions={
            <>
              <Button variant="outlined" onClick={goToList}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  void navigate('/dashboard')
                }}
              >
                Home
              </Button>
            </>
          }
        />
      )}
    </div>
  )
}
