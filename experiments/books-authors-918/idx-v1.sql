-- «Честная индексация» обычной схемы под запросы q4–q7 (#918)
ALTER TABLE classic.books ADD KEY year_pages (year, pages), ADD KEY author_pages (author, pages);
ANALYZE TABLE classic.books;
