// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EscrowSystem
 * @dev Sistem escrow untuk transparansi pembayaran katering ke sekolah
 */
contract EscrowSystem {
    address public admin;
    
    struct Escrow {
        address payer;      // Pemerintah/Dinas
        address payee;      // Katering
        uint256 amount;     // Jumlah dana (dalam Wei)
        bool isLocked;      // Status: dana terkunci
        bool isReleased;    // Status: dana sudah dicairkan
        string schoolId;    // ID Sekolah (NPSN)
        uint256 lockedAt;   // Timestamp lock
        uint256 releasedAt; // Timestamp release
    }
    
    mapping(bytes32 => Escrow) public escrows;
    
    event FundLocked(
        bytes32 indexed escrowId, 
        address indexed payer, 
        address indexed payee, 
        uint256 amount,
        string schoolId
    );
    
    event FundReleased(
        bytes32 indexed escrowId,
        address indexed payee,
        uint256 amount
    );

    event FundCancelled(
        bytes32 indexed escrowId,
        address indexed payer,
        uint256 amount,
        string reason
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    /**
     * @dev Lock dana ke escrow (dipanggil oleh backend service)
     * @param escrowId Unique identifier untuk transaksi
     * @param payee Address wallet katering
     * @param schoolId NPSN sekolah
     */
    function lockFund(
        bytes32 escrowId, 
        address payee,
        string memory schoolId
    ) external payable onlyAdmin {
        require(msg.value > 0, "Amount must be greater than 0");
        require(!escrows[escrowId].isLocked, "Escrow already exists");
        require(payee != address(0), "Invalid payee address");
        
        escrows[escrowId] = Escrow({
            payer: msg.sender,
            payee: payee,
            amount: msg.value,
            isLocked: true,
            isReleased: false,
            schoolId: schoolId,
            lockedAt: block.timestamp,
            releasedAt: 0
        });
        
        emit FundLocked(escrowId, msg.sender, payee, msg.value, schoolId);
    }
    
    /**
     * @dev Release dana ke katering (dipanggil setelah verifikasi sekolah)
     * @param escrowId Unique identifier untuk transaksi
     */
    function releaseFund(bytes32 escrowId) external onlyAdmin {
        Escrow storage escrow = escrows[escrowId];
        
        require(escrow.isLocked, "Escrow not found");
        require(!escrow.isReleased, "Already released");
        
        escrow.isReleased = true;
        escrow.releasedAt = block.timestamp;
        
        payable(escrow.payee).transfer(escrow.amount);
        
        emit FundReleased(escrowId, escrow.payee, escrow.amount);
    }
    
    /**
     * @dev Get escrow details
     */
    function getEscrow(bytes32 escrowId) external view returns (
        address payer,
        address payee,
        uint256 amount,
        bool isLocked,
        bool isReleased,
        string memory schoolId
    ) {
        Escrow memory escrow = escrows[escrowId];
        return (
            escrow.payer,
            escrow.payee,
            escrow.amount,
            escrow.isLocked,
            escrow.isReleased,
            escrow.schoolId
        );
    }
    
    /**
     * @dev Cancel escrow dan refund ke payer (untuk emergency/masalah)
     * @param escrowId Unique identifier untuk transaksi
     * @param reason Alasan pembatalan
     */
    function cancelEscrow(bytes32 escrowId, string memory reason) external onlyAdmin {
        Escrow storage escrow = escrows[escrowId];

        require(escrow.isLocked, "Escrow not found");
        require(!escrow.isReleased, "Already released");

        escrow.isLocked = false;

        payable(escrow.payer).transfer(escrow.amount);

        emit FundCancelled(escrowId, escrow.payer, escrow.amount, reason);
    }

    /**
     * @dev Change admin (untuk transfer kontrol)
     */
    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid address");
        admin = newAdmin;
    }
}