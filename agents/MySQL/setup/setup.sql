drop schema if exists DDLeye;
create schema DDLeye;

drop procedure if exists DDLeye.GetTables;
drop procedure if exists DDLeye.GetViews;
drop procedure if exists DDLeye.GetFunctions;
drop procedure if exists DDLeye.GetProcedures;

delimiter |

create procedure DDLeye.GetTables(in targetSchema varchar(255))
begin
	select OBJECT_NAME, TEXT, sha1(TEXT) as CHECKSUM
    from (
		select
			concat(t.TABLE_SCHEMA, '.', t.TABLE_NAME) as OBJECT_NAME
			, concat('CREATE TABLE `', t.TABLE_SCHEMA, '`.`', t.TABLE_NAME, '` (',
				group_concat(
					concat('`', c.COLUMN_NAME, '` '
						, c.COLUMN_TYPE, ' '
						, if (c.IS_NULLABLE = 'NO', 'NOT NULL', 'NULL'), ' '
						, if (c.COLUMN_DEFAULT is not null, concat('DEFAULT ''', c.COLUMN_DEFAULT, ''''), ''), ' '
						, upper(c.EXTRA))
					order by c.ORDINAL_POSITION
					separator ','),
				(select concat(', PRIMARY KEY (', group_concat(concat('`', cc.COLUMN_NAME, '`') order by cc.ORDINAL_POSITION separator ', '), ')') 
					from INFORMATION_SCHEMA.COLUMNS cc 
					where t.TABLE_SCHEMA = cc.TABLE_SCHEMA
						and t.TABLE_NAME = cc.TABLE_NAME
						and cc.COLUMN_KEY = 'PRI'
					group by cc.TABLE_NAME), 
				');') as TEXT
		from INFORMATION_SCHEMA.TABLES as t
		inner join INFORMATION_SCHEMA.COLUMNS as c on t.TABLE_SCHEMA = c.TABLE_SCHEMA
			and t.TABLE_NAME = c.TABLE_NAME
		where t.TABLE_SCHEMA = targetSchema and t.TABLE_TYPE = 'BASE TABLE'
		group by t.TABLE_NAME
	) as metadata;
end |

create procedure DDLeye.GetViews(in targetSchema varchar(255))
begin
	select OBJECT_NAME, TEXT, sha1(TEXT) as CHECKSUM
    from (
		select
			concat(TABLE_SCHEMA, '.', TABLE_NAME) as OBJECT_NAME
			, concat('CREATE VIEW `', targetSchema, '`.`', TABLE_NAME, '` AS ', VIEW_DEFINITION, ';') as TEXT
		from INFORMATION_SCHEMA.VIEWS
		where TABLE_SCHEMA = targetSchema
	) as metadata;
end |

create procedure DDLeye.GetFunctions(in targetSchema varchar(255))
begin
	select OBJECT_NAME, TEXT, sha1(TEXT) as CHECKSUM
    from (
		select
			concat(r.ROUTINE_SCHEMA, '.', r.ROUTINE_NAME) as OBJECT_NAME
			, concat('CREATE FUNCTION `'
				, targetSchema, '`.`', r.ROUTINE_NAME, '` ('
				, ifnull(group_concat(concat(p.PARAMETER_NAME, ' ', p.DTD_IDENTIFIER) order by p.ORDINAL_POSITION separator ', '), '')
				, ') RETURNS ', r.DTD_IDENTIFIER
				,' ', r.ROUTINE_DEFINITION, ' |') as TEXT
		from INFORMATION_SCHEMA.ROUTINES as r
		left join INFORMATION_SCHEMA.PARAMETERS as p 
			on r.ROUTINE_SCHEMA = p.SPECIFIC_SCHEMA and r.ROUTINE_NAME = p.SPECIFIC_NAME
				and p.PARAMETER_NAME is not null
		where r.ROUTINE_SCHEMA = targetSchema 
			and r.ROUTINE_TYPE = 'FUNCTION'
			and r.ROUTINE_BODY = 'SQL'
		group by r.ROUTINE_NAME
	) as metadata;
end |

create procedure DDLeye.GetProcedures(in targetSchema varchar(255))
begin
	select OBJECT_NAME, TEXT, sha1(TEXT) as CHECKSUM
    from (
		select
			concat(r.ROUTINE_SCHEMA, '.', r.ROUTINE_NAME) as OBJECT_NAME
			, concat('CREATE PROCEDURE `'
				, targetSchema, '`.`', r.ROUTINE_NAME, '` ('
				, ifnull(group_concat(concat(p.PARAMETER_MODE, ' ', p.PARAMETER_NAME, ' ', p.DTD_IDENTIFIER) order by p.ORDINAL_POSITION separator ', '), '')
				, ') '
				,' ', r.ROUTINE_DEFINITION, ' |') as TEXT
		from INFORMATION_SCHEMA.ROUTINES as r
		left join INFORMATION_SCHEMA.PARAMETERS as p 
			on r.ROUTINE_SCHEMA = p.SPECIFIC_SCHEMA and r.ROUTINE_NAME = p.SPECIFIC_NAME
				and p.PARAMETER_NAME is not null
		where r.ROUTINE_SCHEMA = targetSchema 
			and r.ROUTINE_TYPE = 'PROCEDURE'
			and r.ROUTINE_BODY = 'SQL'
		group by r.ROUTINE_NAME
	) as metadata;
end |

delimiter ;