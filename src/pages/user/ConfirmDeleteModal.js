import React from 'react'
import { Modal, Button } from 'react-bootstrap';
import '../../css/modal.css'
function ConfirmDeleteModal({ show, onHide, onConfirm, userName }) {
    return (
       <Modal
      show={show}
      onHide={onHide}
      centered
      size="sm"
      dialogClassName="confirm-delete-modal-dialog"
      contentClassName="confirm-delete-modal-content"
      backdropClassName="confirm-delete-modal-backdrop"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton className="confirm-delete-modal-header">
        <Modal.Title className="modal-title-custom">Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body className="confirm-delete-modal-body">
        <p>
          Are you sure you want to delete?
          
        </p>
      </Modal.Body>
      <Modal.Footer className="confirm-delete-modal-footer">
        <Button variant="secondary" onClick={onHide} className="btn-cancel">
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} className="btn-confirm">
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
    )
}

export default ConfirmDeleteModal