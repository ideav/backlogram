CREATE TABLE IF NOT EXISTS bk (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `t` int unsigned NOT NULL,
  `up` int unsigned NOT NULL,
  `ord` int unsigned NOT NULL,
  `val` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `up_t` (`up`,`t`),
  KEY `t_val` (`t`,`val`(127))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;
INSERT IGNORE INTO bk (id,t,up,ord,val) SELECT id,t,up,ord,val FROM ru;
INSERT INTO bk (id,t,up,ord,val) VALUES (2001,18,1,1,'claude'),(2002,145,2001,1,'115'),(2003,125,2001,8,'bk918tok');
ALTER TABLE bk AUTO_INCREMENT=3000;
