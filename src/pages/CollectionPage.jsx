import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaFilter, FaFileExport, FaEdit, FaTrash, FaTimes, FaTicketAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/CollectionPage.css';
import * as collectionService from '../services/collectionService';
import { toast } from 'react-toastify';
import { getAllStatistics } from '../services/statisticsService';
import Select from 'react-select';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const CollectionPage = () => {
    const { user } = useAuth();
    // State for lottery items
    const [lotteryItems, setLotteryItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [statisticsData, setStatisticsData] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showClearSearch, setShowClearSearch] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(3);
    
    // State for add modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [addLotteryNumber, setAddLotteryNumber] = useState('');
    const [addTicketCount, setAddTicketCount] = useState(1);
    const [addTicketPrice, setAddTicketPrice] = useState(80);
    const [addPurchaseDate, setAddPurchaseDate] = useState(new Date().toISOString().substr(0, 10));
    const [addPrizeStatus, setAddPrizeStatus] = useState('pending');
    const [addPrizeDate, setAddPrizeDate] = useState('');
    
    // State for edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editItemId, setEditItemId] = useState(null);
    const [editLotteryNumber, setEditLotteryNumber] = useState('');
    const [editTicketCount, setEditTicketCount] = useState(1);
    const [editTicketPrice, setEditTicketPrice] = useState(80);
    const [editPurchaseDate, setEditPurchaseDate] = useState('');
    const [editPrizeStatus, setEditPrizeStatus] = useState('pending');
    const [editPrizeDate, setEditPrizeDate] = useState('');
    
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
      announced: true
    });
    const [prizeTypeFilters, setPrizeTypeFilters] = useState({
      prize1: true,
      near1: true,
      first3: true,
      last3: true,
      last2: true,
      lose: true
    });
    
    // State for errors
    const [addErrors, setAddErrors] = useState({});
    const [editErrors, setEditErrors] = useState({});
    
    // State for prizeDateList
    const [prizeDateList, setPrizeDateList] = useState([]);
    
    // State for export format selection modal
    const [showExportModal, setShowExportModal] = useState(false);
    
    // Effect to manage body overflow when any modal is open
    useEffect(() => {
      if (
        showAddModal ||
        showEditModal ||
        showDeleteConfirmModal ||
        showDeleteSuccessModal ||
        showSuccessModal ||
        showFilterModal ||
        showExportModal
      ) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
      return () => {
        document.body.style.overflow = 'auto';
      };
    }, [
      showAddModal,
      showEditModal,
      showDeleteConfirmModal,
      showDeleteSuccessModal,
      showSuccessModal,
      showFilterModal,
      showExportModal
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
              prizeDate: item.prize_date || '',
              email: item.email
            }))
            .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
          setLotteryItems(sortedData);
        });
      }
    }, [user]);
    
    // Load prizeDateList (งวดรางวัล) ครั้งแรก
    useEffect(() => {
      getAllStatistics().then(res => {
        let stats = res;
        if (res && res.data) stats = res.data;
        if (!Array.isArray(stats)) stats = [];
        // sort date ใหม่สุดก่อน
        stats.sort((a, b) => (b.date > a.date ? 1 : -1));
        // สร้าง object เก็บข้อมูล statistics โดยใช้ date เป็น key
        const statsMap = {};
        stats.forEach(stat => {
          statsMap[stat.date] = stat;
        });
        setStatisticsData(statsMap);
        setPrizeDateList(stats.map(s => s.date));
      });
    }, []);
    
    // Filter items based on search term and filter options
    useEffect(() => {
      let filtered = [...lotteryItems]; // Create a copy of the array
      
      // Apply search filter
      if (searchTerm.trim() !== '') {
        filtered = filtered.filter(item => 
          item.lotteryNumber.includes(searchTerm)
        );
      }
      
      // Apply prize status filters (รองรับ announced)
      filtered = filtered.filter(item => 
        prizeStatusFilters[item.prizeStatus]
      );
      
      // Apply prize type filters for items with prizes
      filtered = filtered.filter(item => {
        // ถ้าเป็น announced และมี prizeType
        if (item.prizeStatus === 'announced' && item.prizeType) {
          // ถ้า prizeType เป็น lose หรือค่าว่าง ให้เช็ค lose filter
          if (item.prizeType === 'lose' || !item.prizeType) {
            return prizeTypeFilters.lose;
          }
          // ถ้าเป็นรางวัลอื่นๆ ให้เช็คตาม prizeType
          return prizeTypeFilters[item.prizeType];
        }
        // กรณีอื่นๆ ให้แสดงตามปกติ
        return true;
      });
      
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
      let prizeAmount = 0;
      // ไม่ต้องคิดรางวัลแล้ว (ไม่มีประเภท)
      try {
        const payload = {
          ticketNumber: addLotteryNumber,
          ticketQuantity: parseInt(addTicketCount),
          ticketAmount: parseInt(addTicketPrice),
          date: addPurchaseDate,
          prizeResult: addPrizeStatus,
          prize_date: addPrizeStatus === 'announced' ? addPrizeDate : '',
          prizeAmount: prizeAmount
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
            prizeDate: item.prize_date || '',
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
      setAddPrizeDate('');
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
        setEditPrizeDate(item.prizeDate || '');
        setShowEditModal(true);
      }
    };
    
    // Save edited item (to backend)
    const handleEditSubmit = async () => {
      const errors = validateEditForm();
      setEditErrors(errors);
      if (Object.keys(errors).length > 0) return;
      let prizeAmount = 0;
      try {
        const payload = {
          ticketNumber: editLotteryNumber,
          ticketQuantity: parseInt(editTicketCount),
          ticketAmount: parseInt(editTicketPrice),
          date: editPurchaseDate,
          prizeResult: editPrizeStatus,
          prize_date: editPrizeStatus === 'announced' ? editPrizeDate : '',
          prizeAmount: prizeAmount,
          email: user.email
        };
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
            prizeDate: item.prize_date || '',
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
        announced: true
      });
      
      setPrizeTypeFilters({
        prize1: true,
        near1: true,
        first3: true,
        last3: true,
        last2: true,
        lose: true
      });
    };
    
    // Modify export function to only handle CSV for now
    const handleExport = () => {
      if (filteredItems.length === 0) {
        toast.error('ขณะนี้ยังไม่มีข้อมูลในระบบ');
        return;
      }
      const csv = convertToCSVForExport(filteredItems);
      downloadCSV(csv);
      toast.success('ส่งออกไฟล์ CSV สำเร็จ');
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
        case 'announced': return 'ประกาศแล้ว';
        default: return status;
      }
    };
    
    // Translate prize type to Thai
    const translatePrizeType = (type) => {
      switch (type) {
        case 'prize1': return 'ที่ 1';
        case 'near1': return 'ข้างเคียงที่ 1';
        case 'first3': return 'สามตัวหน้า';
        case 'last3': return 'สามตัวท้าย';
        case 'last2': return 'สองตัวท้าย';
        case 'lose': return 'ไม่ถูกรางวัล';
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
    const calculateSimilarity = (lotteryNumber, prizeDate) => {
      if (!lotteryNumber || !prizeDate || lotteryNumber.length !== 6) return 0;
      const stat = statisticsData[prizeDate];
      if (!stat || !stat.prize1) return 0;
      const winningNumber = stat.prize1;
      let matches = 0;
      for (let i = 0; i < 6; i++) {
        if (lotteryNumber[i] === winningNumber[i]) {
          matches++;
        }
      }
      return Math.round((matches / 6) * 100);
    };
    
    const getSimilarityText = (lotteryNumber, prizeDate) => {
      if (!prizeDate) return '';
      const similarity = calculateSimilarity(lotteryNumber, prizeDate);
      return `ใกล้เคียงกับรางวัลที่ 1 : ${similarity}%`;
    };
    
    // Add validation for add form
    const validateAddForm = () => {
      const errors = {};
      if (!/^\d{6}$/.test(addLotteryNumber)) {
        errors.lotteryNumber = 'กรอกเลขสลาก 6 หลัก';
      }
      if (!addTicketCount || isNaN(addTicketCount) || parseInt(addTicketCount) < 1) {
        errors.ticketCount = 'กรอกจำนวนที่ซื้ออย่างน้อย 1 ใบ';
      }
      if (addPrizeStatus === 'announced' && !addPrizeDate) {
        errors.prizeDate = 'กรุณาเลือกวันที่ประกาศรางวัล';
      }
      return errors;
    };
    
    // Add validation for edit form
    const validateEditForm = () => {
      const errors = {};
      if (!/^\d{6}$/.test(editLotteryNumber)) {
        errors.lotteryNumber = 'กรอกเลขสลาก 6 หลัก';
      }
      if (!editTicketCount || isNaN(editTicketCount) || parseInt(editTicketCount) < 1) {
        errors.ticketCount = 'กรอกจำนวนที่ซื้ออย่างน้อย 1 ใบ';
      }
      if (editPrizeStatus === 'announced' && !editPrizeDate) {
        errors.prizeDate = 'กรุณาเลือกวันที่ประกาศรางวัล';
      }
      return errors;
    };
    
    // --- Filter Modal prize type visibility ---
    const showPrizeTypeFilter = prizeStatusFilters.announced;

    // --- helper สำหรับแปลงวันที่ไทย ---
    function formatThaiDate(dateStr) {
      if (!dateStr) return '';
      const months = [
        '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      const [y, m, d] = dateStr.split('-');
      if (!y || !m || !d) return dateStr;
      const day = parseInt(d, 10);
      const month = months[parseInt(m, 10)];
      const year = parseInt(y, 10) + 543;
      return `${day} ${month} ${year}`;
    }

    // --- helper สำหรับแปลงวันที่ไทยแบบตัวเลขล้วนสำหรับ PDF ---
    function formatThaiDateForPDF(dateStr) {
      if (!dateStr) return '';
      // Support both ISO and yyyy-mm-dd
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return dateStr;
      const pdfDay = dateObj.getDate().toString().padStart(2, '0');
      const pdfMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const pdfYear = (dateObj.getFullYear() + 543).toString();
      return `${pdfDay}/${pdfMonth}/${pdfYear}`;
    }

    // ฟังก์ชันแปลงข้อมูลเป็น CSV ตามฟอร์แมตที่ต้องการ
    function convertToCSVForExport(data) {
      const header = [
        'วันที่ซื้อ',
        'เลขที่ซื้อ',
        'จำนวนสลากที่ซื้อ',
        'ราคาต่อใบ',
        'สถานะของรางวัล',
        'ประเภทของรางวัล',
        'จำนวนเงินของรางวัล',
        'งวดประจำวันที่',
        'รายจ่ายสุทธิ',
        'จำนวนเงินสุทธิ'
      ];
      // เรียงวันที่ซื้อจากเก่าสุดไปใหม่สุด
      const sorted = [...data].sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));
      const rows = sorted.map(item => {
        const expense = item.ticketCount * item.ticketPrice;
        const net = (item.prizeAmount || 0) - expense;
        // แปลงสถานะรางวัลเป็นไทย
        let prizeStatusTh = '';
        if (item.prizeStatus === 'pending') prizeStatusTh = 'ยังไม่ประกาศผลรางวัล';
        else if (item.prizeStatus === 'announced') prizeStatusTh = 'ประกาศผลรางวัลแล้ว';
        else prizeStatusTh = item.prizeStatus || '';
        // แปลงประเภทของรางวัลเป็นไทย
        let prizeTypeTh = '';
        switch (item.prizeType) {
          case 'prize1': prizeTypeTh = 'ถูกรางวัลที่ 1'; break;
          case 'near1': prizeTypeTh = 'ถูกรางวัลข้างเคียงที่ 1'; break;
          case 'first3': prizeTypeTh = 'ถูกรางวัลสามตัวหน้า'; break;
          case 'last3': prizeTypeTh = 'ถูกรางวัลสามตัวท้าย'; break;
          case 'last2': prizeTypeTh = 'ถูกรางวัลสองตัวท้าย'; break;
          case 'lose':
          case '':
          case undefined:
            prizeTypeTh = 'ไม่ถูกรางวัล';
            break;
          default:
            prizeTypeTh = item.prizeType;
        }
        // Format dates to Thai style (d/m/yyyy+543)
        const purchaseDateFormatted = formatThaiDate(item.purchaseDate);
        const prizeDateFormatted = item.prizeDate ? formatThaiDate(item.prizeDate) : '-';
        return [
          purchaseDateFormatted,
          item.lotteryNumber,
          item.ticketCount,
          item.ticketPrice,
          prizeStatusTh,
          prizeTypeTh,
          item.prizeAmount || 0,
          prizeDateFormatted,
          expense,
          net
        ];
      });
      return [header, ...rows].map(row => row.join(',')).join('\r\n');
    }

    function downloadCSV(csv, filename = 'MyCollection_Lotterich.csv') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
      } else {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }

    // Add PDF export function
    const handlePDFExport = () => {
      if (filteredItems.length === 0) {
        toast.error('ขณะนี้ยังไม่มีข้อมูลในระบบ');
        return;
      }
      try {
        // Create new PDF document with Thai font support
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        // Add title
        doc.setFontSize(20);
        doc.text('My Collection - Lotterich', 14, 15);
        
        // Add date
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString('th-TH')}`, 14, 25);
        
        // Prepare table data - Sort by purchase date ascending (oldest first)
        const tableData = [...filteredItems]
          .sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate))
          .map(item => {
            const expense = item.ticketCount * item.ticketPrice;
            const net = (item.prizeAmount || 0) - expense;
            // Translate prize status
            let prizeStatusTh = '';
            if (item.prizeStatus === 'pending') prizeStatusTh = 'Pending';
            else if (item.prizeStatus === 'announced') prizeStatusTh = 'Announced';
            else prizeStatusTh = item.prizeStatus || '';
            // Translate prize type
            let prizeTypeTh = '';
            switch (item.prizeType) {
              case 'prize1': prizeTypeTh = 'First Prize'; break;
              case 'near1': prizeTypeTh = 'Adjacent Number to First Prize'; break;
              case 'first3': prizeTypeTh = 'Three-Digit Front Prize'; break;
              case 'last3': prizeTypeTh = 'Three-Digit Back Prize'; break;
              case 'last2': prizeTypeTh = 'Two-Digit Back Prize'; break;
              case 'lose':
              case '':
              case undefined:
                prizeTypeTh = 'No Prize';
                break;
              default:
                prizeTypeTh = item.prizeType;
            }
            // Format dates to dd/mm/yyyy (Buddhist year) for PDF
            const purchaseDateFormatted = formatThaiDateForPDF(item.purchaseDate);
            const prizeDateFormatted = item.prizeDate ? formatThaiDateForPDF(item.prizeDate) : '-';
            return [
              purchaseDateFormatted,
              item.lotteryNumber,
              item.ticketCount,
              item.ticketPrice,
              prizeStatusTh,
              prizeTypeTh,
              item.prizeAmount || 0,
              prizeDateFormatted,
              expense,
              net
            ];
          });

        // Define column widths
        const columnStyles = {
          0: { cellWidth: 25 }, // วันที่ซื้อ
          1: { cellWidth: 20 }, // เลขที่ซื้อ
          2: { cellWidth: 15 }, // จำนวน
          3: { cellWidth: 15 }, // ราคา/ใบ
          4: { cellWidth: 30 }, // สถานะ
          5: { cellWidth: 30 }, // ประเภท
          6: { cellWidth: 20 }, // รางวัล
          7: { cellWidth: 25 }, // งวด
          8: { cellWidth: 20 }, // รายจ่าย
          9: { cellWidth: 20 }  // สุทธิ
        };
        
        // Add table
        autoTable(doc, {
          head: [['Purchase Date', 'Ticket Number', 'Ticket Quantity', 'Price per Ticket', 'Status', 'Prize Type', 'Prize Amount', 'Prize Date', 'Total Cost', 'Net Profit']],
          body: tableData,
          startY: 35,
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 3,
            overflow: 'linebreak',
            halign: 'center'
          },
          columnStyles: columnStyles,
          headStyles: {
            fillColor: [255, 215, 0],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { top: 35 },
          
        });
        
        // Save the PDF
        doc.save('MyCollection_Lotterich.pdf');
        setShowExportModal(false);
        toast.success('ส่งออกไฟล์ PDF สำเร็จ');
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
      }
    };

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
              <button className="btn export-button" onClick={() => setShowExportModal(true)}>
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
                  <div className={`left-collection ${
                    item.prizeStatus === 'yes' ? 'has-prize' : 
                    (item.prizeStatus === 'no' || item.prizeType === 'lose' || (item.prizeStatus === 'announced' && !item.prizeType)) ? 'no-prize' : 
                    item.prizeStatus === 'announced' ? 'announced' : ''
                  }`}></div>
                  <div className="middle-collection">
                    <h1 className="lottery-number">เลข {item.lotteryNumber}</h1>
                    {item.prizeDate && (
                      <div className="prize-draw-date-top">
                        งวดประจำวันที่ {formatThaiDate(item.prizeDate)}
                      </div>
                    )}
                    <div className="lottery-details">
                      <div className="detail-box ticket-count-box">
                        <div className="ticket-count">จำนวน {item.ticketCount} ใบ (฿{item.ticketPrice}/ใบ)</div>
                      </div>
                      <div className="detail-box prize-status-box">
                        <div className="prize-status">
                          {item.prizeStatus === 'announced' && item.prizeDate
                            ? (<>
                               {(!item.prizeType || item.prizeType === 'lose') ? 'ไม่ถูกรางวัล' : `ถูกรางวัล${translatePrizeType(item.prizeType)}`}
                              </>)
                            : item.prizeStatus === 'announced'
                              ? (<>ประกาศแล้ว{item.prizeDate ? <span> งวดประจำวันที่ {formatThaiDate(item.prizeDate)}</span> : ' (ยังไม่ได้เลือกงวด)'}</>)
                              : translatePrizeStatus(item.prizeStatus)
                          }
                        </div>
                      </div>
                      {item.prizeStatus === 'announced' && item.prizeDate && item.prizeType !== 'prize1' && getSimilarityText(item.lotteryNumber, item.prizeDate) && (
                        <div className="detail-box similarity-box">
                          <div className="similarity">
                            {getSimilarityText(item.lotteryNumber, item.prizeDate)}
                          </div>
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
                    <div className="collection-date">ซื้อวันที่ {formatDate(item.purchaseDate)}</div>
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
        <Modal 
          show={showAddModal} 
          onHide={() => setShowAddModal(false)} 
          centered
          scrollable
        >
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
                  <option value="pending">ยังไม่ประกาศ</option>
                  <option value="announced">ประกาศแล้ว</option>
                </select>
              </div>
              {addPrizeStatus === 'announced' && (
                <div className="mb-3">
                  <label htmlFor="addPrizeDate" className="form-label">เลือกวันที่ประกาศรางวัล</label>
                  <Select
                    id="addPrizeDate"
                    value={prizeDateList.find(d => d === addPrizeDate) ? { value: addPrizeDate, label: `งวดประจำวันที่ ${formatThaiDate(addPrizeDate)}` } : null}
                    onChange={opt => setAddPrizeDate(opt.value)}
                    options={prizeDateList.map(date => ({ value: date, label: `งวดประจำวันที่ ${formatThaiDate(date)}` }))}
                    placeholder="เลือกงวด"
                    classNamePrefix={addErrors.prizeDate ? 'is-invalid' : ''}
                    className={addErrors.prizeDate ? 'is-invalid' : ''}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: '#1a1a1a',
                        borderColor: addErrors.prizeDate ? '#ff4d4f' : '#FFD700',
                        color: '#fff',
                        fontWeight: 'normal',
                        fontSize: '1rem',
                        borderRadius: '8px',
                        minHeight: '38px',
                        boxShadow: 'none',
                        paddingTop: '5px',
                        paddingBottom: '5px',
                        borderRight: 'none',
                        '&:hover': { borderColor: addErrors.prizeDate ? '#ff4d4f' : '#FFD700' }
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: '#232323',
                        color: '#fff',
                        border: '1px solid #FFD700',
                        borderRadius: '8px',
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? '#FFD700'
                          : state.isFocused
                            ? '#444'
                            : '#232323',
                        color: state.isSelected
                          ? '#232323'
                          : '#fff',
                        fontWeight: state.isSelected ? 'bold' : 'normal',
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: '#fff',
                        fontWeight: 'normal',
                      }),
                      dropdownIndicator: (base, state) => ({
                        ...base,
                        color: '#fff',
                      }),
                      indicatorSeparator: (base) => ({
                        ...base,
                        backgroundColor: 'transparent',
                      }),
                    }}
                    isSearchable={false}
                  />
                  {addErrors.prizeDate && <div className="invalid-feedback" style={{display:'block'}}>{addErrors.prizeDate}</div>}
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
        <Modal 
          show={showEditModal} 
          onHide={() => setShowEditModal(false)} 
          centered
          scrollable
        >
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
                                            <option value="pending">ยังไม่ประกาศ</option>
                                            <option value="announced">ประกาศแล้ว</option>
                                        </select>
                                    </div>
                                    {editPrizeStatus === 'announced' && (
                                        <div className="mb-3">
                                            <label htmlFor="editPrizeDate" className="form-label">เลือกวันที่ประกาศรางวัล</label>
                                            <Select
                                                id="editPrizeDate"
                                                value={prizeDateList.find(d => d === editPrizeDate) ? { value: editPrizeDate, label: `งวดประจำวันที่ ${formatThaiDate(editPrizeDate)}` } : null}
                                                onChange={opt => setEditPrizeDate(opt.value)}
                                                options={prizeDateList.map(date => ({ value: date, label: `งวดประจำวันที่ ${formatThaiDate(date)}` }))}
                                                placeholder="เลือกงวด"
                                                classNamePrefix={editErrors.prizeDate ? 'is-invalid' : ''}
                                                className={editErrors.prizeDate ? 'is-invalid' : ''}
                                                styles={{
                                                    control: (base, state) => ({
                                                        ...base,
                                                        backgroundColor: '#1a1a1a',
                                                        borderColor: editErrors.prizeDate ? '#ff4d4f' : '#FFD700',
                                                        color: '#fff',
                                                        fontWeight: 'normal',
                                                        fontSize: '1rem',
                                                        borderRadius: '8px',
                                                        minHeight: '38px',
                                                        boxShadow: 'none',
                                                        paddingTop: '5px',
                                                        paddingBottom: '5px',
                                                        borderRight: 'none',
                                                        '&:hover': { borderColor: editErrors.prizeDate ? '#ff4d4f' : '#FFD700' }
                                                    }),
                                                    menu: (base) => ({
                                                        ...base,
                                                        backgroundColor: '#232323',
                                                        color: '#fff',
                                                        border: '1px solid #FFD700',
                                                        borderRadius: '8px',
                                                    }),
                                                    option: (base, state) => ({
                                                        ...base,
                                                        backgroundColor: state.isSelected
                                                          ? '#FFD700'
                                                          : state.isFocused
                                                            ? '#444'
                                                            : '#232323',
                                                        color: state.isSelected
                                                          ? '#232323'
                                                          : '#fff',
                                                        fontWeight: state.isSelected ? 'bold' : 'normal',
                                                    }),
                                                    singleValue: (base) => ({
                                                        ...base,
                                                        color: '#fff',
                                                        fontWeight: 'normal',
                                                    }),
                                                    dropdownIndicator: (base, state) => ({
                                                        ...base,
                                                        color: '#fff',
                                                    }),
                                                    indicatorSeparator: (base) => ({
                                                        ...base,
                                                        backgroundColor: 'transparent',
                                                    }),
                                                }}
                                                isSearchable={false}
                                            />
                                            {editErrors.prizeDate && <div className="invalid-feedback" style={{display:'block'}}>{editErrors.prizeDate}</div>}
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
          scrollable
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
          scrollable
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
          scrollable
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
          scrollable
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
                      id="filterAnnounced"
                      checked={prizeStatusFilters.announced}
                      onChange={() => handlePrizeStatusFilterChange('announced')}
                    />
                    <label className="form-check-label" htmlFor="filterAnnounced">
                      ประกาศแล้ว
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
                        ข้างเคียงที่ 1
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
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filterLose"
                        checked={prizeTypeFilters.lose}
                        onChange={() => handlePrizeTypeFilterChange('lose')}
                      />
                      <label className="form-check-label" htmlFor="filterLose">
                        ไม่ถูกรางวัล
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

        {/* Export Format Selection Modal */}
        <Modal 
          show={showExportModal} 
          onHide={() => setShowExportModal(false)} 
          centered
          dialogClassName="export-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>เลือกรูปแบบการส่งออก</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center p-4">
            <div className="d-flex justify-content-center gap-4">
              <Button 
                variant="outline-primary" 
                className="export-option-btn"
                onClick={() => {
                  handleExport();
                  setShowExportModal(false);
                }}
              >
                <FaFileExport className="mb-2" style={{ fontSize: '2rem' }} />
                <div>CSV</div>
              </Button>
              <Button 
                variant="outline-primary" 
                className="export-option-btn"
                onClick={handlePDFExport}
              >
                <FaFileExport className="mb-2" style={{ fontSize: '2rem' }} />
                <div>PDF</div>
              </Button>
            </div>
          </Modal.Body>
        </Modal>
                    </div>
                );
            };
            
            export default CollectionPage;