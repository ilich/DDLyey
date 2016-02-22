# DDLyey
Full-text search for database metadata.

## About DDLeye
DDLeye is an application that indexes database metadata and provides powerful search capabilities for those indexes. 
The application will be useful for database administrators, database developers or anybody who is responsible 
for large database maintenance.

The application consists of two parts: database agents and web UI.

Database agents are responsible to update the index. They can update the indexes as a batch or in real-time if your database management
system supports DDL triggers (e.g. Microsoft SQL Server). I built only MySQL database agent at the moment. It works as a batch, because MySQL 
does not support DDL triggers.

Web UI allows users to view the indexes and search using full-text search and regular expression capabilities.
The web-application also provides REST API to manage the indexes. The API might be used by database agents developers to integrate with
DDLeye.

## Technology Stack
* Node.js
* MongoDB (use MongoDB full-text indexes)
* Bootstrap

## Future Plans
* Add more features to the Web UI, e.g. ability to remove the indexes and manage them from the UI, etc.
* Use Elasticsearch instead of MongoDB fulltext search to improve search quality.
* MySQL database agent tuning.
* Build agents for MS SQL Server, PostgreSQL, MariaDB and Oracle
* Index constraints and triggers
* Parse views, stored procedures and functions to build dependency maps
* Create user documentation