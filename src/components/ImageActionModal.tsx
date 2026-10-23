import { Button } from './Button.tsx'
import { Modal } from './Modal.tsx'

export interface ImageActionModalProps {
  // 1-based, as in "image 2".
  position: number
  onClose: () => void
  onRemove: () => void
  onReplace: () => void
}

// Figma "Attention Modal", opened from a thumbnail's ×.
export function ImageActionModal({
  position,
  onClose,
  onRemove,
  onReplace,
}: ImageActionModalProps): React.JSX.Element {
  return (
    <Modal
      tone="warning"
      title="Attention !"
      description={`Do you want to remove image ${String(position)}, or replace it with another picture?`}
      closeLabel="Close"
      onClose={onClose}
    >
      <Button variant="danger" onClick={onRemove}>
        Remove
      </Button>
      <Button onClick={onReplace}>Replace</Button>
    </Modal>
  )
}
