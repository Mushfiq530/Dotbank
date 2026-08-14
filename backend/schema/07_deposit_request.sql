-- Table: deposit_request
CREATE TABLE deposit_request (
    request_id VARCHAR(50) PRIMARY KEY,
    requester_name VARCHAR(150) NOT NULL,
    source VARCHAR(100) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
