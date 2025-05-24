import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaTicketAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/ManagePage.css';
import { getAllStatistics, addStatistics, updateStatistics, deleteStatistics } from '../services/statisticsService';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const d = new Date(dateString);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
};

const itemsPerPage = 3;

const ManagePage = () => {
  const [draws, setDraws] = useState([]);
  const [search, setSearch] = useState('');
  const [showClearSearch, setShowClearSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAction, setSuccessAction] = useState('add');
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ date: '', prize1: '', first3: ['', ''], last3: ['', ''], last2: '' });
  const [errors, setErrors] = useState({});

  // Fetch all statistics on component mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const data = await getAllStatistics();
      // Debug log
      console.log('Raw statistics from backend:', data);

      // Transform the data to match the expected format
      const transformedData = data.map(stat => ({
        id: stat.id || stat._id || '',
        date: stat.date,
        prize1: stat.prize1,
        first3: [
          stat.first3_one || '',
          stat.first3_two || ''
        ],
        last3: [
          stat.last3_one || '',
          stat.last3_two || ''
        ],
        last2: stat.last2
      }));

      console.log('Transformed data:', transformedData);
      setDraws(transformedData);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setDraws([]);
    }
  };

  // Filtered and paginated draws
  const filteredDraws = draws
    .filter(draw => formatDate(draw.date).includes(search))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalPages = Math.ceil(filteredDraws.length / itemsPerPage);
  const currentItems = filteredDraws.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search, draws.length]);

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    setShowClearSearch(e.target.value.length > 0);
  };
  const clearSearch = () => { setSearch(''); setShowClearSearch(false); };

  // Modal handlers
  const handleOpenAddModal = () => {
    // หา latest date
    let latestDate = '';
    if (draws.length > 0) {
      // sort ตามวันที่มากสุด
      const sorted = [...draws].sort((a, b) => new Date(b.date) - new Date(a.date));
      latestDate = sorted[0].date;
    } else {
      // ถ้าไม่มีข้อมูล ใช้วันนี้
      const today = new Date();
      latestDate = today.toISOString().slice(0, 10);
    }
    setForm({ date: latestDate, prize1: '', first3: ['', ''], last3: ['', ''], last2: '' });
    setErrors({});
    setShowAddModal(true);
  };
  const handleOpenEditModal = (draw) => { setEditId(draw.id); setForm({ ...draw }); setErrors({}); setShowEditModal(true); };
  const handleCloseModal = () => { setShowAddModal(false); setShowEditModal(false); setShowDeleteConfirmModal(false); setErrors({}); };
  const handleOpenDeleteConfirm = (id) => { setDeleteId(id); setShowDeleteConfirmModal(true); };

  // Form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('first3-')) {
      const idx = Number(name.split('-')[1]);
      setForm(f => ({ ...f, first3: f.first3.map((v, i) => (i === idx ? value : v)) }));
    } else if (name.startsWith('last3-')) {
      const idx = Number(name.split('-')[1]);
      setForm(f => ({ ...f, last3: f.last3.map((v, i) => (i === idx ? value : v)) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  // Validation
  const validateForm = (f) => {
    const errs = {};
    if (!/^\d{6}$/.test(f.prize1)) errs.prize1 = 'กรอกเลข 6 หลัก';
    if (!/^\d{3}$/.test(f.first3[0]) || !/^\d{3}$/.test(f.first3[1])) errs.first3 = 'กรอกสามตัวหน้า 3 หลัก';
    if (!/^\d{3}$/.test(f.last3[0]) || !/^\d{3}$/.test(f.last3[1])) errs.last3 = 'กรอกสามตัวท้าย 3 หลัก';
    if (!/^\d{2}$/.test(f.last2)) errs.last2 = 'กรอกสองตัวท้าย 2 หลัก';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) errs.date = 'เลือกวันที่';
    return errs;
  };

  // Add/Edit/Delete
  const handleAdd = async () => {
    const errs = validateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      const payload = {
        date: form.date,
        prize1: form.prize1,
        first3_one: form.first3[0],
        first3_two: form.first3[1],
        last3_one: form.last3[0],
        last3_two: form.last3[1],
        last2: form.last2
      };

      const newStat = await addStatistics(payload);
      setDraws([{
        id: newStat.id,
        date: newStat.date,
        prize1: newStat.prize1,
        first3: [newStat.first3_one, newStat.first3_two],
        last3: [newStat.last3_one, newStat.last3_two],
        last2: newStat.last2
      }, ...draws]);
      setShowAddModal(false);
      setSuccessAction('add');
      setShowSuccessModal(true);
    } catch (error) {
      setErrors({ api: error.response?.data?.error || 'เกิดข้อผิดพลาด' });
    }
  };

  const handleEdit = async () => {
    const errs = validateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      const payload = {
        date: form.date,
        prize1: form.prize1,
        first3_one: form.first3[0],
        first3_two: form.first3[1],
        last3_one: form.last3[0],
        last3_two: form.last3[1],
        last2: form.last2
      };

      await updateStatistics(editId, payload);
      setDraws(draws.map(d => d.id === editId ? {
        ...d,
        date: form.date,
        prize1: form.prize1,
        first3: form.first3,
        last3: form.last3,
        last2: form.last2
      } : d));
      setShowEditModal(false);
      setSuccessAction('edit');
      setShowSuccessModal(true);
    } catch (error) {
      setErrors({ api: error.response?.data?.error || 'เกิดข้อผิดพลาด' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStatistics(deleteId);
      setDraws(draws.filter(d => d.id !== deleteId));
      setShowDeleteConfirmModal(false);
      setSuccessAction('delete');
      setShowSuccessModal(true);
    } catch (error) {
      setErrors({ api: error.response?.data?.error || 'เกิดข้อผิดพลาด' });
    }
  };

  // Pagination rendering
  const renderPaginationItems = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button key={i} className={`btn ${currentPage === i ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setCurrentPage(i)}>{i}</button>
        );
      }
    } else {
      pages.push(
        <button key={1} className={`btn ${currentPage === 1 ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setCurrentPage(1)}>1</button>
      );
      if (currentPage > 4) pages.push(<span key="start-ellipsis" className="pagination-ellipsis">...</span>);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(
          <button key={i} className={`btn ${currentPage === i ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setCurrentPage(i)}>{i}</button>
        );
      }
      if (currentPage < totalPages - 3) pages.push(<span key="end-ellipsis" className="pagination-ellipsis">...</span>);
      pages.push(
        <button key={totalPages} className={`btn ${currentPage === totalPages ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
      );
    }
    return pages;
  };

  return (
    <div className="manage-container">
      <h1 className="manage-title">Manage Statistics</h1>
      <div className="manage-controls">
        <div className="manage-search-input-container">
          <input
            type="text"
            className="manage-search-input"
            placeholder="ค้นหางวดวันที่"
            value={search}
            onChange={handleInputChange}
          />
          {showClearSearch && (
            <button className="clear-search-btn" onClick={clearSearch}><FaTimes /></button>
          )}
        </div>
        <button className="manage-btn add-btn" onClick={handleOpenAddModal}><FaPlus /> Add</button>
      </div>
      <div className="manage-content-list">
        {/* Empty State */}
        {draws.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><FaTicketAlt /></div>
            <h3>ขณะนี้ยังไม่มีงวดที่บันทึกไว้</h3>
            <p>เริ่มบันทึกงวดของคุณได้เลย</p>
          </div>
        )}
        {/* No Results */}
        {draws.length > 0 && filteredDraws.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon"><FaTicketAlt /></div>
            <h3>ไม่พบนัดที่ต้องการ</h3>
            <p>ลองค้นหางวดอื่น หรือเพิ่มงวดใหม่</p>
          </div>
        )}
        {/* Content Items */}
        {currentItems.map(draw => (
          <div className="manage-content-item" key={draw.id}>
            
            <div className="middle-collection">
              <h2 className="lottery-number">รางวัลที่ 1 : {draw.prize1}</h2>
              <div className="lottery-details">
                <div className="detail-box ticket-count-box">
                  <span className="ticket-count">สามตัวหน้า : {draw.first3[0]} , {draw.first3[1]}</span>
                </div>
                <div className="detail-box prize-status-box">
                  <span className="prize-status">สามตัวท้าย : {draw.last3[0]} , {draw.last3[1]}</span>
                </div>
                <div className="detail-box similarity-box">
                  <span className="similarity">สองตัวท้าย : {draw.last2}</span>
                </div>
              </div>
            </div>
            <div className="right-collection">
              <div className="collection-actions">
                <button className="btn-edit" onClick={() => handleOpenEditModal(draw)}><FaEdit /></button>
                <button className="btn-delete" onClick={() => handleOpenDeleteConfirm(draw.id)}><FaTrash /></button>
              </div>
              <div className="collection-date">{formatDate(draw.date)}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Pagination */}
      {filteredDraws.length > 0 && (
        <div className="pagination">{renderPaginationItems()}</div>
      )}

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={handleCloseModal} centered scrollable>
        <Modal.Header closeButton><Modal.Title>เพิ่มงวด</Modal.Title></Modal.Header>
        <Modal.Body>
          <form>
            <div className="mb-3">
              <label className="form-label">งวดวันที่</label>
              <input type="date" className={`form-control${errors.date ? ' is-invalid' : ''}`} name="date" value={form.date} onChange={handleFormChange} />
              {errors.date && <div className="invalid-feedback" style={{display:'block'}}>{errors.date}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">รางวัลที่ 1</label>
              <input type="text" className={`form-control${errors.prize1 ? ' is-invalid' : ''}`} name="prize1" value={form.prize1} onChange={handleFormChange} maxLength={6} autoComplete="off" />
              {errors.prize1 && <div className="invalid-feedback" style={{display:'block'}}>{errors.prize1}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">สามตัวหน้า</label>
              <div className="d-flex gap-2">
                <input type="text" className={`form-control${errors.first3 ? ' is-invalid' : ''}`} name="first3-0" value={form.first3[0]} onChange={handleFormChange} maxLength={3} autoComplete="off" />
                <input type="text" className={`form-control${errors.first3 ? ' is-invalid' : ''}`} name="first3-1" value={form.first3[1]} onChange={handleFormChange} maxLength={3} autoComplete="off" />
              </div>
              {errors.first3 && <div className="invalid-feedback" style={{display:'block'}}>{errors.first3}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">สามตัวท้าย</label>
              <div className="d-flex gap-2">
                <input type="text" className={`form-control${errors.last3 ? ' is-invalid' : ''}`} name="last3-0" value={form.last3[0]} onChange={handleFormChange} maxLength={3} autoComplete="off" />
                <input type="text" className={`form-control${errors.last3 ? ' is-invalid' : ''}`} name="last3-1" value={form.last3[1]} onChange={handleFormChange} maxLength={3} autoComplete="off" />
              </div>
              {errors.last3 && <div className="invalid-feedback" style={{display:'block'}}>{errors.last3}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">สองตัวท้าย</label>
              <input type="text" className={`form-control${errors.last2 ? ' is-invalid' : ''}`} name="last2" value={form.last2} onChange={handleFormChange} maxLength={2} autoComplete="off" />
              {errors.last2 && <div className="invalid-feedback" style={{display:'block'}}>{errors.last2}</div>}
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleAdd}>ยืนยัน</Button>
          <Button variant="secondary" onClick={handleCloseModal}>ยกเลิก</Button>
        </Modal.Footer>
      </Modal>
      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={handleCloseModal} centered scrollable>
        <Modal.Header closeButton><Modal.Title>แก้ไขงวด</Modal.Title></Modal.Header>
        <Modal.Body>
          <form>
            <div className="mb-3">
              <label className="form-label">งวดวันที่</label>
              <input type="date" className={`form-control${errors.date ? ' is-invalid' : ''}`} name="date" value={form.date} onChange={handleFormChange} />
              {errors.date && <div className="invalid-feedback" style={{display:'block'}}>{errors.date}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">รางวัลที่ 1</label>
              <input type="text" className={`form-control${errors.prize1 ? ' is-invalid' : ''}`} name="prize1" value={form.prize1} onChange={handleFormChange} maxLength={6} autoComplete="off" />
              {errors.prize1 && <div className="invalid-feedback" style={{display:'block'}}>{errors.prize1}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">สามตัวหน้า</label>
              <div className="d-flex gap-2">
                <input type="text" className={`form-control${errors.first3 ? ' is-invalid' : ''}`} name="first3-0" value={form.first3[0]} onChange={handleFormChange} maxLength={3} autoComplete="off" />
                <input type="text" className={`form-control${errors.first3 ? ' is-invalid' : ''}`} name="first3-1" value={form.first3[1]} onChange={handleFormChange} maxLength={3} autoComplete="off" />
              </div>
              {errors.first3 && <div className="invalid-feedback" style={{display:'block'}}>{errors.first3}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">สามตัวท้าย</label>
              <div className="d-flex gap-2">
                <input type="text" className={`form-control${errors.last3 ? ' is-invalid' : ''}`} name="last3-0" value={form.last3[0]} onChange={handleFormChange} maxLength={3} autoComplete="off" />
                <input type="text" className={`form-control${errors.last3 ? ' is-invalid' : ''}`} name="last3-1" value={form.last3[1]} onChange={handleFormChange} maxLength={3} autoComplete="off" />
              </div>
              {errors.last3 && <div className="invalid-feedback" style={{display:'block'}}>{errors.last3}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">สองตัวท้าย</label>
              <input type="text" className={`form-control${errors.last2 ? ' is-invalid' : ''}`} name="last2" value={form.last2} onChange={handleFormChange} maxLength={2} autoComplete="off" />
              {errors.last2 && <div className="invalid-feedback" style={{display:'block'}}>{errors.last2}</div>}
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleEdit}>บันทึก</Button>
          <Button variant="secondary" onClick={handleCloseModal}>ยกเลิก</Button>
        </Modal.Footer>
      </Modal>
      {/* Delete Confirm Modal */}
      <Modal show={showDeleteConfirmModal} onHide={handleCloseModal} centered>
        <Modal.Body className="text-center p-4">
          <FaExclamationTriangle className="text-warning mb-3" style={{ fontSize: '3rem' }} />
          <h5 className="modal-title mb-3">ยืนยันการลบ</h5>
          <p className="mb-0">คุณแน่ใจหรือไม่ที่จะลบข้อมูลงวดนี้?</p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center border-0">
          <Button variant="danger" onClick={handleDelete}>ยืนยัน</Button>
          <Button variant="secondary" onClick={handleCloseModal}>ยกเลิก</Button>
        </Modal.Footer>
      </Modal>
      {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered dialogClassName="success-modal">
        <Modal.Body className="text-center p-4">
          <FaCheckCircle className="text-success mb-3" style={{ fontSize: '3rem' }} />
          <h5 className="modal-title mb-3">
            {successAction === 'add' && 'เพิ่มข้อมูลสำเร็จ'}
            {successAction === 'edit' && 'แก้ไขข้อมูลสำเร็จ'}
            {successAction === 'delete' && 'ลบข้อมูลสำเร็จ'}
          </h5>
          <p className="mb-0">
            {successAction === 'add' && 'ข้อมูลงวดของคุณได้รับการเพิ่มเรียบร้อยแล้ว'}
            {successAction === 'edit' && 'ข้อมูลงวดของคุณได้รับการแก้ไขเรียบร้อยแล้ว'}
            {successAction === 'delete' && 'ข้อมูลงวดของคุณถูกลบเรียบร้อยแล้ว'}
          </p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center border-0">
          <Button variant="success" onClick={() => setShowSuccessModal(false)}>ตกลง</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ManagePage; 