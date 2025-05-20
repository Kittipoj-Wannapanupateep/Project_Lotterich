import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaFilter, FaFileExport, FaEdit, FaTrash, FaTimes, FaTicketAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/CollectionPage.css';
import * as collectionService from '../services/collectionService';
import { toast } from 'react-toastify';

const CollectionPage = () => {
    const { user } = useAuth();
    // State for lottery items
    const [lotteryItems, setLotteryItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showClearSearch, setShowClearSearch] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    
    // State for add modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [addLotteryNumber, setAddLotteryNumber] = useState('');
    const [addTicketCount, setAddTicketCount] = useState(1);
    const [addTicketPrice, setAddTicketPrice] = useState(80);
    const [addPurchaseDate, setAddPurchaseDate] = useState(new Date().toISOString().substr(0, 10));
    const [addPrizeStatus, setAddPrizeStatus] = useState('pending');
    const [addPrizeType, setAddPrizeType] = useState('prize1');
    const [addWinningNumber, setAddWinningNumber] = useState('');
    
    // State for edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editItemId, setEditItemId] = useState(null);
    const [editLotteryNumber, setEditLotteryNumber] = useState('');
    const [editTicketCount, setEditTicketCount] = useState(1);
    const [editTicketPrice, setEditTicketPrice] = useState(80);
    const [editPurchaseDate, setEditPurchaseDate] = useState('');
    const [editPrizeStatus, setEditPrizeStatus] = useState('pending');
    const [editPrizeType, setEditPrizeType] = useState('prize1');
    const [editWinningNumber, setEditWinningNumber] = useState('');
    
    // State for success and delete modals
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successAction, setSuccessAction] = useState('add'); // 'add' or 'edit'
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
    
    // State for filter modal
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [prizeStatusFilters, setPrizeStatusFilters] = useState({
      pending: true,
      no: true,
      yes: true
    });
    const [prizeTypeFilters, setPrizeTypeFilters] = useState({
      prize1: true,
      near1: true,
      prize2: true,
      prize3: true,
      prize4: true,
      prize5: true,
      first3: true,
      last3: true,
      last2: true
    });
    
    // State for errors
    const [addErrors, setAddErrors] = useState({});
    const [editErrors, setEditErrors] = useState({});
    
    // Effect to manage body overflow when any modal is open
    useEffect(() => {
      if (
        showAddModal ||
        showEditModal ||
        showDeleteConfirmModal ||
        showDeleteSuccessModal ||
        showSuccessModal ||
        showFilterModal
      ) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
      return () => {
        document.body.classList.remove('modal-open');
      };
    }, [
      showAddModal,
      showEditModal,
      showDeleteConfirmModal,
      showDeleteSuccessModal,
      showSuccessModal,
      showFilterModal,
    ]);
    
    // Function to scroll to top
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };
    
    // Fetch collection from backend
    useEffect(() => {
      if (user) {
        collectionService.getCollection().then(data => {
          const sortedData = data
            .map(item => ({
              id: item.id,
              lotteryNumber: item.ticketNumber,
              ticketCount: item.ticketQuantity,
              ticketPrice: item.ticketAmount,
              purchaseDate: item.date,
              prizeStatus: item.prizeResult,
              prizeType: item.prizeType,
              prizeAmount: item.prizeAmount,
              winningNumber: item.ticketWinning || '',
              email: item.email
            }))
            .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
          setLotteryItems(sortedData);
        });
      }
    }, [user]);
    
    // Filter items based on search term and filter options
    useEffect(() => {
      let filtered = [...lotteryItems]; // Create a copy of the array
      
      // Apply search filter
      if (searchTerm.trim() !== '') {
        filtered = filtered.filter(item => 
          item.lotteryNumber.includes(searchTerm)
        );
      }
      
      // Apply prize status filters
      filtered = filtered.filter(item => 
        prizeStatusFilters[item.prizeStatus]
      );
      
      // Apply prize type filters for items with prizes
      filtered = filtered.filter(item => 
        item.prizeStatus !== 'yes' || prizeTypeFilters[item.prizeType]
      );
      
      setFilteredItems(filtered);
      setCurrentPage(1); // Reset to first page when filters change
    }, [searchTerm, lotteryItems, prizeStatusFilters, prizeTypeFilters]);
    
    // Handle search input change
    const handleSearchChange = (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      setShowClearSearch(value.length > 0);
    };
    
    // Clear search
    const clearSearch = () => {
        setSearchTerm('');
      setShowClearSearch(false);
    };
    
    // Add new lottery item (to backend)
    const handleAddSubmit = async () => {
      const errors = validateAddForm();
      setAddErrors(errors);
      if (Object.keys(errors).length > 0) return;
      
      let winningNumberToSave = '';
      if ((addPrizeStatus === 'yes' || addPrizeStatus === 'no') && addWinningNumber && addWinningNumber.trim() !== '') {
        winningNumberToSave = addWinningNumber;
      }
      
      // PrizeAmount logic
      let prizeAmount = 0;
      if (addPrizeStatus === 'yes') {
        switch (addPrizeType) {
          case 'prize1': prizeAmount = 6000000; break;
          case 'near1': prizeAmount = 100000; break;
          case 'prize2': prizeAmount = 200000; break;
          case 'prize3': prizeAmount = 80000; break;
          case 'prize4': prizeAmount = 40000; break;
          case 'prize5': prizeAmount = 20000; break;
          case 'first3':
          case 'last3': prizeAmount = 4000; break;
          case 'last2': prizeAmount = 2000; break;
          default: prizeAmount = 0;
        }
      }

      try {
        const payload = {
          ticketNumber: addLotteryNumber,
          ticketQuantity: parseInt(addTicketCount),
          ticketAmount: parseInt(addTicketPrice),
          date: addPurchaseDate,
          prizeResult: addPrizeStatus,
          prizeType: addPrizeStatus === 'yes' ? addPrizeType : '',
          prizeAmount: prizeAmount,
          ticketWinning: winningNumberToSave
        };

        await collectionService.addCollection(payload);
        
        // Refresh list and sort by date
        const data = await collectionService.getCollection();
        const sortedData = data
          .map(item => ({
            id: item.id,
            lotteryNumber: item.ticketNumber,
            ticketCount: item.ticketQuantity,
            ticketPrice: item.ticketAmount,
            purchaseDate: item.date,
            prizeStatus: item.prizeResult,
            prizeType: item.prizeType,
            prizeAmount: item.prizeAmount,
            winningNumber: item.ticketWinning || '',
            email: item.email
          }))
          .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
        
        setLotteryItems(sortedData);
        resetAddForm();
        setAddErrors({});
        setShowAddModal(false);
        setSuccessAction('add');
        setShowSuccessModal(true);
        scrollToTop();
      } catch (error) {
        console.error('Error adding collection:', error);
        toast.error(error.response?.data?.error || 'Failed to add collection');
      }
    };
    
    // Reset add form
    const resetAddForm = () => {
      setAddLotteryNumber('');
      setAddTicketCount(1);
      setAddTicketPrice(80);
      setAddPurchaseDate(new Date().toISOString().substr(0, 10));
      setAddPrizeStatus('pending');
      setAddPrizeType('prize1');
      setAddWinningNumber('');
    };
    
    // Open edit modal
    const handleEdit = (itemId) => {
      const item = lotteryItems.find(item => item.id === itemId);
      if (item) {
        setEditItemId(item.id);
        setEditLotteryNumber(item.lotteryNumber);
        setEditTicketCount(item.ticketCount);
        setEditTicketPrice(item.ticketPrice || 80);
        setEditPurchaseDate(item.purchaseDate ? item.purchaseDate.substr(0, 10) : '');
        setEditPrizeStatus(item.prizeStatus);
        setEditPrizeType(item.prizeType || 'prize1');
        setEditWinningNumber(item.winningNumber || '');
        setShowEditModal(true);
      }
    };
    
    // Save edited item (to backend)
    const handleEditSubmit = async () => {
      const errors = validateEditForm();
      setEditErrors(errors);
      if (Object.keys(errors).length > 0) return;
      
      let winningNumberToSave = '';
      if ((editPrizeStatus === 'yes' || editPrizeStatus === 'no') && editWinningNumber && editWinningNumber.trim() !== '') {
        winningNumberToSave = editWinningNumber;
      }
      
      let prizeAmount = 0;
      if (editPrizeStatus === 'yes') {
        switch (editPrizeType) {
          case 'prize1': prizeAmount = 6000000; break;
          case 'near1': prizeAmount = 100000; break;
          case 'prize2': prizeAmount = 200000; break;
          case 'prize3': prizeAmount = 80000; break;
          case 'prize4': prizeAmount = 40000; break;
          case 'prize5': prizeAmount = 20000; break;
          case 'first3':
          case 'last3': prizeAmount = 4000; break;
          case 'last2': prizeAmount = 2000; break;
          default: prizeAmount = 0;
        }
      }
      const payload = {
        ticketNumber: editLotteryNumber,
        ticketQuantity: parseInt(editTicketCount),
        ticketAmount: parseInt(editTicketPrice),
        date: editPurchaseDate,
        prizeResult: editPrizeStatus,
        prizeType: editPrizeStatus === 'yes' ? editPrizeType : '',
        prizeAmount,
        ticketWinning: winningNumberToSave,
        email: user.email
      };
      try {
        await collectionService.updateCollection(editItemId, payload);
        // Refresh list and sort by date
        const data = await collectionService.getCollection();
        const sortedData = data
          .map(item => ({
            id: item.id,
            lotteryNumber: item.ticketNumber,
            ticketCount: item.ticketQuantity,
            ticketPrice: item.ticketAmount,
            purchaseDate: item.date,
            prizeStatus: item.prizeResult,
            prizeType: item.prizeType,
            prizeAmount: item.prizeAmount,
            winningNumber: item.ticketWinning || '',
            email: item.email
          }))
          .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
        
        setLotteryItems(sortedData);
        setEditErrors({});
        setShowEditModal(false);
        setSuccessAction('edit');
        setShowSuccessModal(true);
        scrollToTop();
      } catch (error) {
        console.error('Error updating collection:', error);
        toast.error(error.response?.data?.error || 'Failed to update collection');
      }
    };
    
    // Delete confirmation
    const handleDeleteConfirm = (itemId) => {
      setDeleteItemId(itemId);
      setShowDeleteConfirmModal(true);
    };
    
    // Delete item (from backend)
    const handleDelete = async () => {
      try {
        await collectionService.deleteCollection(deleteItemId);
        // Update lotteryItems state by filtering out the deleted item
        setLotteryItems(prevItems => prevItems.filter(item => item.id !== deleteItemId));
        setShowDeleteConfirmModal(false);
        setShowDeleteSuccessModal(true);
        scrollToTop();
      } catch (error) {
        console.error('Error deleting collection:', error);
        toast.error(error.response?.data?.error || 'Failed to delete collection');
      }
    };
    
    // Apply filter
    const handleApplyFilter = () => {
      setShowFilterModal(false);
    };
    
    // Reset filter
    const handleResetFilter = () => {
      setPrizeStatusFilters({
        pending: true,
        no: true,
        yes: true
      });
      
      setPrizeTypeFilters({
        prize1: true,
        near1: true,
        prize2: true,
        prize3: true,
        prize4: true,
        prize5: true,
        first3: true,
        last3: true,
        last2: true
      });
    };
    
    // Export data
    const handleExport = () => {
      console.log("Exporting data:", filteredItems);
      // Implementation would typically involve creating a CSV or Excel file
      alert("Export functionality would be implemented here");
    };
    
    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    
    // Generate pagination items
    const renderPaginationItems = () => {
      const pages = [];
      
      if (totalPages <= 7) {
        // Show all pages if 7 or fewer
        for (let i = 1; i <= totalPages; i++) {
          pages.push(
            <button
              key={i}
              className={`btn ${currentPage === i ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => {
                setCurrentPage(i);
                scrollToTop();
              }}
            >
              {i}
            </button>
          );
        }
      } else {
        // Always show first page
        pages.push(
          <button
            key={1}
            className={`btn ${currentPage === 1 ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => {
              setCurrentPage(1);
              scrollToTop();
            }}
          >
            1
          </button>
        );
        
        // Determine start and end of the centered section
        let startPage, endPage;
        if (currentPage <= 4) {
          startPage = 2;
          endPage = 6;
          
          pages.push(
            ...Array(endPage - startPage + 1).fill().map((_, idx) => {
              const page = startPage + idx;
              return (
                <button
                  key={page}
                  className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => {
                    setCurrentPage(page);
                    scrollToTop();
                  }}
                >
                  {page}
                </button>
              );
            })
          );
          
          pages.push(
            <span key="ellipsis-end" className="pagination-ellipsis">...</span>
          );
        } else if (currentPage >= totalPages - 3) {
          pages.push(
            <span key="ellipsis-start" className="pagination-ellipsis">...</span>
          );
          
          startPage = totalPages - 5;
          endPage = totalPages - 1;
          
          pages.push(
            ...Array(endPage - startPage + 1).fill().map((_, idx) => {
              const page = startPage + idx;
              return (
                <button
                  key={page}
                  className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => {
                    setCurrentPage(page);
                    scrollToTop();
                  }}
                >
                  {page}
                </button>
              );
            })
          );
        } else {
          pages.push(
            <span key="ellipsis-start" className="pagination-ellipsis">...</span>
          );
          
          startPage = currentPage - 1;
          endPage = currentPage + 1;
          
          pages.push(
            ...Array(endPage - startPage + 1).fill().map((_, idx) => {
              const page = startPage + idx;
              return (
                <button
                  key={page}
                  className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => {
                    setCurrentPage(page);
                    scrollToTop();
                  }}
                >
                  {page}
                </button>
              );
            })
          );
          
          pages.push(
            <span key="ellipsis-end" className="pagination-ellipsis">...</span>
          );
        }
        
        // Always show last page
        pages.push(
          <button
            key={totalPages}
            className={`btn ${currentPage === totalPages ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => {
              setCurrentPage(totalPages);
              scrollToTop();
            }}
          >
            {totalPages}
          </button>
        );
      }
      
      return pages;
    };
    
    // Format date for display
    const formatDate = (dateString) => {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('th-TH', options);
    };
    
    // Translate prize status to Thai
    const translatePrizeStatus = (status) => {
      switch (status) {
        case 'pending': return 'ยังไม่ประกาศรางวัล';
        case 'no': return 'ไม่ถูกรางวัล';
        case 'yes': return 'ถูกรางวัล';
        default: return status;
      }
    };
    
    // Translate prize type to Thai
    const translatePrizeType = (type) => {
      switch (type) {
        case 'prize1': return 'รางวัลที่ 1';
        case 'near1': return 'รางวัลข้างเคียงที่ 1';
        case 'prize2': return 'รางวัลที่ 2';
        case 'prize3': return 'รางวัลที่ 3';
        case 'prize4': return 'รางวัลที่ 4';
        case 'prize5': return 'รางวัลที่ 5';
        case 'first3': return 'สามตัวหน้า';
        case 'last3': return 'สามตัวท้าย';
        case 'last2': return 'สองตัวท้าย';
        default: return '';
      }
    };
    
    // Change filter checkbox
    const handlePrizeStatusFilterChange = (status) => {
      setPrizeStatusFilters({
        ...prizeStatusFilters,
        [status]: !prizeStatusFilters[status]
      });
    };
    
    const handlePrizeTypeFilterChange = (type) => {
      setPrizeTypeFilters({
        ...prizeTypeFilters,
        [type]: !prizeTypeFilters[type]
      });
    };
    
    // Add these helper functions after the existing helper functions
    const calculateSimilarity = (lotteryNumber, winningNumber) => {
      if (!lotteryNumber || !winningNumber || lotteryNumber.length !== 6 || winningNumber.length !== 6) return 0;
      let matches = 0;
      for (let i = 0; i < 6; i++) {
        if (lotteryNumber[i] === winningNumber[i]) {
          matches++;
        }
      }
      return Math.round((matches / 6) * 100);
    };
    
    const getSimilarityText = (lotteryNumber, winningNumber) => {
      if (!winningNumber || winningNumber.length !== 6) return '';
      const similarity = calculateSimilarity(lotteryNumber, winningNumber);
      return `ใกล้เคียงกับรางวัลที่ 1 : ${similarity}%`;
    };
    
    // Add validation for add form
    const validateAddForm = () => {
      const errors = {};
      if (!/^\d{6}$/.test(addLotteryNumber)) {
        errors.lotteryNumber = 'กรุณากรอกเลขสลาก 6 หลัก';
      }
      if (!addTicketCount || isNaN(addTicketCount) || parseInt(addTicketCount) < 1) {
        errors.ticketCount = 'กรุณากรอกจำนวนที่ซื้ออย่างน้อย 1 ใบ';
      }
      if (addWinningNumber && !/^\d{6}$/.test(addWinningNumber)) {
        errors.winningNumber = 'กรุณากรอกเลข 6 หลัก';
      }
      return errors;
    };
    
    // Add validation for edit form
    const validateEditForm = () => {
      const errors = {};
      if (!/^\d{6}$/.test(editLotteryNumber)) {
        errors.lotteryNumber = 'กรุณากรอกเลขสลาก 6 หลัก';
      }
      if (!editTicketCount || isNaN(editTicketCount) || parseInt(editTicketCount) < 1) {
        errors.ticketCount = 'กรุณากรอกจำนวนที่ซื้ออย่างน้อย 1 ใบ';
      }
      if (editWinningNumber && !/^\d{6}$/.test(editWinningNumber)) {
        errors.winningNumber = 'กรุณากรอกเลข 6 หลัก';
      }
      return errors;
    };
    
    // --- Filter Modal prize type visibility ---
    const showPrizeTypeFilter = prizeStatusFilters.yes;

    return (
      <div className="container-fluid">

        
        
        {/* Main content */}
        <div className="collection-container">
          <h1 className="collection-title">Collection</h1>
            <div className="collection-content">
            {/* Search and Controls */}
                <div className="search-bar">
                    <div className="search-input-container">
                        <input
                            type="text"
                            className="form-control search-input"
                  maxLength={6}
                  placeholder="ค้นหาเลขสลากกินแบ่ง"
                            value={searchTerm}
                  onChange={handleSearchChange}
                />
                {showClearSearch && (
                  <button className="clear-search-btn" onClick={clearSearch}>
                                <FaTimes />
                            </button>
                        )}
                    </div>
              <button className="btn add-button" onClick={() => setShowAddModal(true)}>
                <FaPlus /> Add
                    </button>
              <button className="btn filter-button" onClick={() => setShowFilterModal(true)}>
                        <FaFilter /> Filter
                    </button>
              <button className="btn export-button" onClick={handleExport}>
                        <FaFileExport /> Export
                    </button>
                </div>

            {/* Collection Items */}
                <div className="collection-items">
              {/* Empty State Message */}
              {lotteryItems.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <FaTicketAlt />
                  </div>
                  <h3>ขณะนี้ยังไม่มีสลากที่บันทึกไว้</h3>
                  <p>เริ่มบันทึกสลากของคุณได้เลย</p>
                </div>
              )}
              
              {/* No Results Message (search/filter) */}
              {lotteryItems.length > 0 && filteredItems.length === 0 && (
                <div className="no-results">
                  <div className="no-results-icon">
                    <FaSearch />
                  </div>
                  <h3>ไม่พบเลขสลากที่ต้องการ</h3>
                  <p>ลองเปลี่ยนเงื่อนไขการกรอง หรือเพิ่มสลากใหม่</p>
                </div>
              )}
              
              {/* Collection Items */}
              {currentItems.map(item => (
                            <div key={item.id} className="collection-item">
                  <div className={`left-collection ${item.prizeStatus === 'yes' ? 'has-prize' : item.prizeStatus === 'no' ? 'no-prize' : ''}`}></div>
                                <div className="middle-collection">
                    <h2 className="lottery-number">เลข {item.lotteryNumber}</h2>
                                    <div className="lottery-details">
                                        <div className="detail-box ticket-count-box">
                        <div className="ticket-count">จำนวน {item.ticketCount} ใบ (฿{item.ticketPrice}/ใบ)</div>
                                        </div>
                                        <div className="detail-box prize-status-box">
                        <div className="prize-status">
                          {translatePrizeStatus(item.prizeStatus)}
                          {item.prizeStatus === 'yes' && item.prizeType && ` (${translatePrizeType(item.prizeType)})`}
                        </div>
                                        </div>
                      {item.winningNumber && item.winningNumber.length === 6 && (
                                            <div className="detail-box similarity-box has-similarity">
                          <div className="similarity">{getSimilarityText(item.lotteryNumber, item.winningNumber)}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="right-collection">
                                    <div className="collection-actions">
                      <button className="btn-edit" onClick={() => handleEdit(item.id)}>
                                            <FaEdit />
                                        </button>
                      <button className="btn-delete" onClick={() => handleDeleteConfirm(item.id)}>
                                            <FaTrash />
                                        </button>
                                    </div>
                    <div className="collection-date">{formatDate(item.purchaseDate)}</div>
                        </div>
                </div>
              ))}
                </div>

            {/* Pagination */}
            {filteredItems.length > 0 && (
                    <div className="pagination">
                {renderPaginationItems()}
                    </div>
                )}
            </div>
        </div>
        
        

            {/* Add Modal */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>เพิ่มข้อมูลสลาก</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form id="addForm">
                                    <div className="mb-3">
                <label htmlFor="addLotteryNumber" className="form-label">เลขสลาก</label>
                                        <input
                                            type="text"
                  className={`form-control${addErrors.lotteryNumber ? ' is-invalid' : ''}`} 
                  id="addLotteryNumber" 
                  value={addLotteryNumber} 
                  onChange={e => setAddLotteryNumber(e.target.value.replace(/\D/g, '').slice(0,6))} 
                  maxLength={6}
                  autoComplete="off"
                />
                {addErrors.lotteryNumber && <div className="invalid-feedback" style={{display:'block'}}>{addErrors.lotteryNumber}</div>}
                                    </div>
                                    <div className="mb-3">
                <div className="d-flex gap-3">
                  <div className="flex-grow-1">
                    <label htmlFor="addTicketCount" className="form-label mb-2">จำนวนที่ซื้อ</label>
                    <input 
                      type="number" 
                      className={`form-control${addErrors.ticketCount ? ' is-invalid' : ''}`} 
                      id="addTicketCount" 
                      min="1" 
                      value={addTicketCount} 
                      onChange={e => setAddTicketCount(e.target.value)}
                    />
                    {addErrors.ticketCount && <div className="invalid-feedback" style={{display:'block'}}>{addErrors.ticketCount}</div>}
                  </div>
                  <div className="flex-grow-1">
                    <label htmlFor="addTicketPrice" className="form-label mb-2">ราคาต่อใบ</label>
                                        <input
                                            type="number"
                                            className="form-control"
                      id="addTicketPrice" 
                      min="0" 
                      value={addTicketPrice} 
                      onChange={e => setAddTicketPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="addPurchaseDate" className="form-label">วันที่ซื้อ</label>
                <input 
                  type="date" 
                  className="form-control" 
                  id="addPurchaseDate" 
                  value={addPurchaseDate} 
                  onChange={e => setAddPurchaseDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-3">
                <label htmlFor="addPrizeStatus" className="form-label">ผลรางวัล</label>
                <select 
                  className="form-select" 
                  id="addPrizeStatus" 
                  value={addPrizeStatus} 
                  onChange={e => setAddPrizeStatus(e.target.value)}
                >
                  <option value="pending">ยังไม่ประกาศรางวัล</option>
                  <option value="no">ไม่ถูกรางวัล</option>
                  <option value="yes">ถูกรางวัล</option>
                </select>
              </div>
              {addPrizeStatus === 'yes' && (
                <div className="mb-3">
                  <label htmlFor="addPrizeType" className="form-label">ประเภทรางวัล</label>
                                        <select
                                            className="form-select"
                    id="addPrizeType" 
                    value={addPrizeType} 
                    onChange={e => setAddPrizeType(e.target.value)}
                  >
                    <option value="prize1">รางวัลที่ 1</option>
                    <option value="near1">รางวัลข้างเคียงที่ 1</option>
                    <option value="prize2">รางวัลที่ 2</option>
                    <option value="prize3">รางวัลที่ 3</option>
                    <option value="prize4">รางวัลที่ 4</option>
                    <option value="prize5">รางวัลที่ 5</option>
                    <option value="first3">สามตัวหน้า</option>
                    <option value="last3">สามตัวท้าย</option>
                    <option value="last2">สองตัวท้าย</option>
                                        </select>
                                    </div>
              )}
              {(addPrizeStatus === 'yes' || addPrizeStatus === 'no') && (
                                    <div className="mb-3">
                  <label htmlFor="addWinningNumber" className="form-label">เลขที่ถูกรางวัลที่ 1 (ไม่บังคับ)</label>
                                        <input
                                            type="text"
                    className={`form-control${addErrors.winningNumber ? ' is-invalid' : ''}`} 
                    id="addWinningNumber" 
                    maxLength="6" 
                    value={addWinningNumber} 
                    onChange={e => setAddWinningNumber(e.target.value.replace(/\D/g, '').slice(0,6))}
                  />
                  {addErrors.winningNumber && <div className="invalid-feedback" style={{display:'block'}}>{addErrors.winningNumber}</div>}
                </div>
            )}
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleAddSubmit}>
              ยืนยัน
            </Button>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              ยกเลิก
            </Button>
          </Modal.Footer>
        </Modal>

            {/* Edit Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>แก้ไขข้อมูลสลาก</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form id="editForm">
                                    <div className="mb-3">
                <label htmlFor="editLotteryNumber" className="form-label">เลขสลาก</label>
                                        <input
                                            type="text"
                                            className={`form-control${editErrors.lotteryNumber ? ' is-invalid' : ''}`}
                                            id="editLotteryNumber"
                                            value={editLotteryNumber}
                                            onChange={e => setEditLotteryNumber(e.target.value.replace(/\D/g, '').slice(0,6))}
                                            maxLength={6}
                                            autoComplete="off"
                                        />
                                        {editErrors.lotteryNumber && <div className="invalid-feedback" style={{display:'block'}}>{editErrors.lotteryNumber}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <div className="d-flex gap-3">
                                            <div className="flex-grow-1">
                                                <label htmlFor="editTicketCount" className="form-label mb-2">จำนวนที่ซื้อ</label>
                                                <input 
                                                    type="number" 
                                                    className={`form-control${editErrors.ticketCount ? ' is-invalid' : ''}`} 
                                                    id="editTicketCount" 
                                                    min="1" 
                                                    value={editTicketCount} 
                                                    onChange={e => setEditTicketCount(e.target.value)}
                                                />
                                                {editErrors.ticketCount && <div className="invalid-feedback" style={{display:'block'}}>{editErrors.ticketCount}</div>}
                                            </div>
                                            <div className="flex-grow-1">
                                                <label htmlFor="editTicketPrice" className="form-label mb-2">ราคาต่อใบ</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    id="editTicketPrice" 
                                                    min="0" 
                                                    value={editTicketPrice} 
                                                    onChange={e => setEditTicketPrice(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editPurchaseDate" className="form-label">วันที่ซื้อ</label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            id="editPurchaseDate" 
                                            value={editPurchaseDate} 
                                            onChange={e => setEditPurchaseDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editPrizeStatus" className="form-label">ผลรางวัล</label>
                                        <select
                                            className="form-select"
                                            id="editPrizeStatus"
                                            value={editPrizeStatus} 
                                            onChange={e => setEditPrizeStatus(e.target.value)}
                                        >
                                            <option value="pending">ยังไม่ประกาศรางวัล</option>
                                            <option value="no">ไม่ถูกรางวัล</option>
                                            <option value="yes">ถูกรางวัล</option>
                                        </select>
                                    </div>
                                    {editPrizeStatus === 'yes' && (
                                        <div className="mb-3">
                                            <label htmlFor="editPrizeType" className="form-label">ประเภทรางวัล</label>
                                            <select 
                                                className="form-select" 
                                                id="editPrizeType" 
                                                value={editPrizeType} 
                                                onChange={e => setEditPrizeType(e.target.value)}
                                            >
                                                <option value="prize1">รางวัลที่ 1</option>
                                                <option value="near1">รางวัลข้างเคียงที่ 1</option>
                                                <option value="prize2">รางวัลที่ 2</option>
                                                <option value="prize3">รางวัลที่ 3</option>
                                                <option value="prize4">รางวัลที่ 4</option>
                                                <option value="prize5">รางวัลที่ 5</option>
                                                <option value="first3">สามตัวหน้า</option>
                                                <option value="last3">สามตัวท้าย</option>
                                                <option value="last2">สองตัวท้าย</option>
                                            </select>
                                        </div>
                                    )}
                                    {(editPrizeStatus === 'yes' || editPrizeStatus === 'no') && (
                                        <div className="mb-3">
                                            <label htmlFor="editWinningNumber" className="form-label">เลขที่ถูกรางวัลที่ 1 (ไม่บังคับ)</label>
                                            <input
                                                type="text"
                                                className={`form-control${editErrors.winningNumber ? ' is-invalid' : ''}`} 
                                                id="editWinningNumber" 
                                                maxLength="6" 
                                                value={editWinningNumber} 
                                                onChange={e => setEditWinningNumber(e.target.value.replace(/\D/g, '').slice(0,6))}
                                            />
                                            {editErrors.winningNumber && <div className="invalid-feedback" style={{display:'block'}}>{editErrors.winningNumber}</div>}
                                        </div>
                                    )}
                                </form>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="primary" onClick={handleEditSubmit}>
                                    ยืนยัน
                                </Button>
                                <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                                    ยกเลิก
                                </Button>
                            </Modal.Footer>
                        </Modal>

                        {/* Success Modal */}
        <Modal 
          show={showSuccessModal} 
          onHide={() => setShowSuccessModal(false)} 
          centered
          dialogClassName="success-modal"
        >
          <Modal.Body className="text-center p-4">
            <FaCheckCircle className="text-success mb-3" style={{ fontSize: '3rem' }} />
            <h5 className="modal-title mb-3">ดำเนินการสำเร็จ</h5>
            <p className="mb-0">
              {successAction === 'add' 
                ? 'ข้อมูลสลากของคุณได้รับการบันทึกเรียบร้อยแล้ว'
                : 'ข้อมูลสลากของคุณได้รับแก้ไขเรียบร้อยแล้ว'
              }
            </p>
          </Modal.Body>
          <Modal.Footer className="justify-content-center border-0">
            <Button variant="success" onClick={() => setShowSuccessModal(false)}>
              ตกลง
            </Button>
          </Modal.Footer>
        </Modal>

            {/* Delete Confirmation Modal */}
        <Modal 
          show={showDeleteConfirmModal} 
          onHide={() => setShowDeleteConfirmModal(false)} 
          centered
          dialogClassName="delete-confirm-modal"
        >
          <Modal.Body className="text-center p-4">
            <FaExclamationTriangle className="text-warning mb-3" style={{ fontSize: '3rem' }} />
            <h5 className="modal-title mb-3">ยืนยันการลบ</h5>
            <p className="mb-0">คุณแน่ใจหรือไม่ที่จะลบข้อมูลสลากนี้?</p>
          </Modal.Body>
          <Modal.Footer className="justify-content-center border-0">
            <Button variant="danger" onClick={handleDelete}>
              ยืนยัน
            </Button>
            <Button variant="secondary" onClick={() => setShowDeleteConfirmModal(false)}>
              ยกเลิก
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Delete Success Modal */}
        <Modal 
          show={showDeleteSuccessModal} 
          onHide={() => setShowDeleteSuccessModal(false)} 
          centered
          dialogClassName="delete-success-modal"
        >
          <Modal.Body className="text-center p-4">
            <FaCheckCircle className="text-success mb-3" style={{ fontSize: '3rem' }} />
            <h5 className="modal-title mb-3">ลบข้อมูลสำเร็จ</h5>
            <p className="mb-0">ข้อมูลสลากของคุณถูกลบเรียบร้อยแล้ว</p>
          </Modal.Body>
          <Modal.Footer className="justify-content-center border-0">
            <Button variant="success" onClick={() => setShowDeleteSuccessModal(false)}>
              ตกลง
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Filter Modal */}
        <Modal 
          show={showFilterModal} 
          onHide={() => setShowFilterModal(false)} 
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>กรองข้อมูลสลาก</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form id="filterForm">
              <div className="mb-3">
                <label className="form-label">สถานะรางวัล</label>
                <div className="filter-options">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="filterPending"
                      checked={prizeStatusFilters.pending}
                      onChange={() => handlePrizeStatusFilterChange('pending')}
                    />
                    <label className="form-check-label" htmlFor="filterPending">
                      ยังไม่ประกาศรางวัล
                    </label>
                            </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="filterNo"
                      checked={prizeStatusFilters.no}
                      onChange={() => handlePrizeStatusFilterChange('no')}
                    />
                    <label className="form-check-label" htmlFor="filterNo">
                      ไม่ถูกรางวัล
                    </label>
                        </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="filterYes"
                      checked={prizeStatusFilters.yes}
                      onChange={() => handlePrizeStatusFilterChange('yes')}
                    />
                    <label className="form-check-label" htmlFor="filterYes">
                      ถูกรางวัล
                    </label>
                    </div>
                </div>
                            </div>
              {/* Prize Type Filter */}
              {showPrizeTypeFilter && (
                <div className="mb-3">
                  <label className="form-label">ประเภทรางวัล</label>
                                <div className="filter-options">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                        id="filterPrize1"
                        checked={prizeTypeFilters.prize1}
                        onChange={() => handlePrizeTypeFilterChange('prize1')}
                      />
                      <label className="form-check-label" htmlFor="filterPrize1">
                        รางวัลที่ 1
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filterNear1"
                        checked={prizeTypeFilters.near1}
                        onChange={() => handlePrizeTypeFilterChange('near1')}
                      />
                      <label className="form-check-label" htmlFor="filterNear1">
                        รางวัลข้างเคียงที่ 1
                                        </label>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                        id="filterPrize2"
                        checked={prizeTypeFilters.prize2}
                        onChange={() => handlePrizeTypeFilterChange('prize2')}
                      />
                      <label className="form-check-label" htmlFor="filterPrize2">
                        รางวัลที่ 2
                                        </label>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                        id="filterPrize3"
                        checked={prizeTypeFilters.prize3}
                        onChange={() => handlePrizeTypeFilterChange('prize3')}
                      />
                      <label className="form-check-label" htmlFor="filterPrize3">
                        รางวัลที่ 3
                                        </label>
                                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filterPrize4"
                        checked={prizeTypeFilters.prize4}
                        onChange={() => handlePrizeTypeFilterChange('prize4')}
                      />
                      <label className="form-check-label" htmlFor="filterPrize4">
                        รางวัลที่ 4
                      </label>
                                </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filterPrize5"
                        checked={prizeTypeFilters.prize5}
                        onChange={() => handlePrizeTypeFilterChange('prize5')}
                      />
                      <label className="form-check-label" htmlFor="filterPrize5">
                        รางวัลที่ 5
                      </label>
                            </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filterFirst3"
                        checked={prizeTypeFilters.first3}
                        onChange={() => handlePrizeTypeFilterChange('first3')}
                      />
                      <label className="form-check-label" htmlFor="filterFirst3">
                        สามตัวหน้า
                      </label>
                            </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filterLast3"
                        checked={prizeTypeFilters.last3}
                        onChange={() => handlePrizeTypeFilterChange('last3')}
                      />
                      <label className="form-check-label" htmlFor="filterLast3">
                        สามตัวท้าย
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filterLast2"
                        checked={prizeTypeFilters.last2}
                        onChange={() => handlePrizeTypeFilterChange('last2')}
                      />
                      <label className="form-check-label" htmlFor="filterLast2">
                        สองตัวท้าย
                      </label>
                        </div>
                    </div>
                </div>
            )}
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleApplyFilter}>
              ยืนยัน
            </Button>
            <Button variant="secondary" onClick={handleResetFilter}>
              รีเซ็ต
            </Button>
          </Modal.Footer>
        </Modal>
                    </div>
                );
            };
            
            export default CollectionPage;