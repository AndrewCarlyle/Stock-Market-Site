DROP TABLE if exists customers;
DROP TABLE if exists accounts;
DROP TABLE if exists CustomerAccounts;
DROP TABLE if exists exchanges;
DROP TABLE if exists stocks;
DROP TABLE if exists StocksInAccounts;

CREATE TABLE customers(
    SSN text primary key not null, --unique social security number
    Name text not null,
    Address text not null,
    DOB text not null, --Date of birth in format DD-MM-YYYY
    PWord text not null
);

INSERT INTO customers VALUES(123456789, 'Andrew Carlyle', '123 Main', '29-06-1990', 'Test');
INSERT INTO customers VALUES(987654321, 'Elon Musk', '12 Bronson', '12-08-1962', 'Elon Musk');
INSERT INTO customers VALUES(111111111, 'Bill Gates', '54 Campus', '01-10-2000', 'Microsoft');
INSERT INTO customers VALUES(111222333, 'Jeff Bezos', '112 Bank', '30-12-1952', 'Test456');
INSERT INTO customers VALUES(444555666, 'Warren Buffet', '1 Terry Fox', '15-11-2001', 'GOAT');

CREATE TABLE accounts(
    AcctNum text primary key not null, --unique account number (5 digits)
    Type text not null, --TSFA, RRSP, etc
    Balance number not null
);

INSERT INTO accounts VALUES(12345, 'TFSA', 1000);
INSERT INTO accounts VALUES(54321, 'RRSP', 1234);
INSERT INTO accounts VALUES(11223, 'LIRA', 1000000);
INSERT INTO accounts VALUES(98765, 'RESP', 12000);
INSERT INTO accounts VALUES(56789, 'TFSA', 6000);
INSERT INTO accounts VALUES(99988, 'TFSA', 0);
INSERT INTO accounts VALUES(55555, 'TFSA', 100);
INSERT INTO accounts VALUES(66666, 'LIRA', 50);
INSERT INTO accounts VALUES(77777, 'RRSP', 500);
INSERT INTO accounts VALUES(88888, 'RRIF', 999);

CREATE TABLE CustomerAccounts(
    SSN text not null,
    AcctNum text not null,
    primary key (SSN, AcctNum),
    foreign key (SSN)  references customers(SSN) on delete cascade,
    foreign key (AcctNum)  references accounts(AcctNum) on delete cascade
);

INSERT INTO CustomerAccounts VALUES(987654321, 12345);
INSERT INTO CustomerAccounts VALUES(987654321, 54321);
INSERT INTO CustomerAccounts VALUES(987654321, 11223);
INSERT INTO CustomerAccounts VALUES(987654321, 98765);
INSERT INTO CustomerAccounts VALUES(123456789, 56789);
INSERT INTO CustomerAccounts VALUES(111111111, 99988);
INSERT INTO CustomerAccounts VALUES(444555666, 55555);
INSERT INTO CustomerAccounts VALUES(111222333, 66666);
INSERT INTO CustomerAccounts VALUES(111222333, 77777);
INSERT INTO CustomerAccounts VALUES(111222333, 88888);

CREATE TABLE exchanges(
    Name text primary key not null,
    Country text not null
);

INSERT INTO exchanges VALUES ('TSX', 'Canada');
INSERT INTO exchanges VALUES ('NYSE', 'United States');
INSERT INTO exchanges VALUES ('NASDAQ', 'United States');

CREATE TABLE stocks(
    Ticker text not null,
    ExName text not null, --Name of the exchange that the stock is on
    Price number not null,
    DivYield number, --not all stocks pay dividends, this can be null
    YearHigh number not null, --Highest price the stock has reached in the past 52 weeks
    YearLow number not null, --Low price the stock has reached in the past 52 weeks
    primary key (Ticker, ExName),
    foreign key (ExName)  references exchanges(Name) on delete cascade
);

INSERT INTO stocks VALUES ('T', 'TSX', 25, 3.2, 30, 20);
INSERT INTO stocks VALUES ('ENB', 'TSX', 45, 7.1, 62, 34);
INSERT INTO stocks VALUES ('BCE', 'TSX', 57, 5.9, 59, 51);
INSERT INTO stocks VALUES ('TD', 'TSX', 82, 3.8, 85, 59);
INSERT INTO stocks VALUES ('SHOP', 'TSX', 1400, NULL, 1432, 390);
INSERT INTO stocks VALUES ('GOOG', 'NASDAQ', 2000, NULL, 2100, 1100);
INSERT INTO stocks VALUES ('AAPL', 'NASDAQ', 125, 1.23, 145, 82);
INSERT INTO stocks VALUES ('MSFT', 'NASDAQ', 237, 1.4, 245, 190);
INSERT INTO stocks VALUES ('AMZN', 'NASDAQ', 3200, NULL, 3300, 1500);
INSERT INTO stocks VALUES ('TSLA', 'NASDAQ', 420, NULL, 900, 100);
INSERT INTO stocks VALUES ('T', 'NYSE', 70, 6.4, 75, 50);
INSERT INTO stocks VALUES ('GME', 'NYSE', 999, NULL, 1000, 15);
INSERT INTO stocks VALUES ('AMC', 'NYSE', 11.5, NULL, 25, 5);
INSERT INTO stocks VALUES ('ARKK', 'NYSE', 121, 1.91, 145, 70);
INSERT INTO stocks VALUES ('SPY', 'NYSE', 398, 1.5, 399, 310);

CREATE TABLE StocksInAccounts(
    Ticker text not null,
    ExName text not null,
    AcctNum text not null,
    NumShares number not null,
    ShareCost number not null, --Avg cost of the shares owned
    primary key (AcctNum, Ticker, ExName),
    foreign key (Ticker)  references stocks(Ticker) on delete cascade,
    foreign key (ExName)  references exchanges(Name) on delete cascade,
    foreign key (AcctNum)  references accounts(AcctNum) on delete cascade
);

INSERT INTO StocksInAccounts VALUES('TSLA', 'NASDAQ', '11223', 420,100);
INSERT INTO StocksInAccounts VALUES('AAPL', 'NASDAQ', '11223', 10, 130);
INSERT INTO StocksInAccounts VALUES('MSFT', 'NASDAQ', '12345', 9, 200);
INSERT INTO StocksInAccounts VALUES('AMZN', 'NASDAQ', '54321', 8, 1500);
INSERT INTO StocksInAccounts VALUES('GOOG', 'NASDAQ', '54321', 100, 50);
INSERT INTO StocksInAccounts VALUES('GOOG', 'NASDAQ', '99988', 221, 700);
INSERT INTO StocksInAccounts VALUES('TSLA', 'NASDAQ', '99988', 31, 300);
INSERT INTO StocksInAccounts VALUES('TSLA', 'NASDAQ', '88888', 1, 500);
INSERT INTO StocksInAccounts VALUES('MSFT', 'NASDAQ', '88888', 2, 190);
INSERT INTO StocksInAccounts VALUES('TSLA', 'NASDAQ', '77777', 3, 120);
INSERT INTO StocksInAccounts VALUES('GME', 'NYSE', '11223', 4, 500);
INSERT INTO StocksInAccounts VALUES('AMC', 'NYSE', '11223', 5, 9);
INSERT INTO StocksInAccounts VALUES('T', 'NYSE', '12345', 1000, 52);
INSERT INTO StocksInAccounts VALUES('ARKK', 'NYSE', '77777', 999, 73);
INSERT INTO StocksInAccounts VALUES('ARKK', 'NYSE', '66666', 50, 139);
INSERT INTO StocksInAccounts VALUES('SPY', 'NYSE', '66666', 54, 250);
INSERT INTO StocksInAccounts VALUES('AMC', 'NYSE', '55555', 9, 11);
INSERT INTO StocksInAccounts VALUES('GME', 'NYSE', '55555', 8, 25);
INSERT INTO StocksInAccounts VALUES('SPY', 'NYSE', '98765', 7, 381);
INSERT INTO StocksInAccounts VALUES('T', 'NYSE', '98765', 70, 43);
INSERT INTO StocksInAccounts VALUES('BCE', 'TSX', '11223', 111, 58 );
INSERT INTO StocksInAccounts VALUES('T', 'TSX', '98765', 39, 19);
INSERT INTO StocksInAccounts VALUES('BCE', 'TSX', '56789', 500, 43);
INSERT INTO StocksInAccounts VALUES('T', 'TSX', '56789', 747, 26);
INSERT INTO StocksInAccounts VALUES('SHOP', 'TSX', '56789', 321, 399);
INSERT INTO StocksInAccounts VALUES('TD', 'TSX', '55555', 1, 63);
INSERT INTO StocksInAccounts VALUES('ENB', 'TSX', '55555', 1, 47);
INSERT INTO StocksInAccounts VALUES('TD', 'TSX', '88888', 1, 77);
INSERT INTO StocksInAccounts VALUES('SHOP', 'TSX', '11223', 4, 1100);
INSERT INTO StocksInAccounts VALUES('ENB', 'TSX', '66666', 91, 36);
