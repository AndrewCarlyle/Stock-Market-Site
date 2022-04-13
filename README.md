# Stock-Market-Site
This is a project that I have taken up using some of my free time. It is a web that allows users to get stock market information a create simulated accounts.

The frontend uses JS, HTML, and CSS. The backend uses JS for the server, a SQL database to keep track of stocks and accounts, and then a Mongo database to keep track of sessions.

TODO list:
1. Add some kind of ranking system for stocks
2. Organize resources better (some things are not accessible to pug files in/views)
3. Add current user info to the top right corner (regardless of the current page, maybe use js within the .html files?)
4. Use pug page to present list of accounts
5. Add in something to limit repeated calls to the API (maybe taking the time into consideration?)
6. Spend some time looking into what happens with TSX stocks
7. Fix updateStock function to account for exchange
8. Consolidate the fetchStockInfo() and updateStock() function together
