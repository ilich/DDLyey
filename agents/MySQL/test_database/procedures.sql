drop procedure if exists GetCitiesByCountry;
drop procedure if exists GetLanguageByCountry;
drop procedure if exists HelloWorldProc;
drop view if exists TotalPopulationByCountryCode;
drop view if exists PopularLanguages;
drop view if exists MostPopularLanguages;
drop function if exists AddNumbers;
drop function if exists SayHello;
drop function if exists HelloWorld;

create view TotalPopulationByCountryCode
as
	select CountryCode, sum(Population) Population
	from City
	group by CountryCode;
	
create view MostPopularLanguages
as
    select CountryCode, max(Percentage) Percentage from CountryLanguage
	group by CountryCode;
	
create view PopularLanguages
as
	select c.CountryCode, c.`Language`, c.Percentage 
	from MostPopularLanguages as pl
	inner join CountryLanguage c on pl.CountryCode = c.CountryCode
	where pl.Percentage = c.Percentage;

delimiter |

create function AddNumbers(a int, b int)
returns int
begin
	return a + b;
end |

create function SayHello(who varchar(50))
returns varchar(90)
begin
	return concat('Hello ,', who, '!');
end |

create function HelloWorld()
returns varchar(90)
begin
	return 'Hello World';
end |

create procedure HelloWorldProc()
begin
	select 'Hello World';
end |

create procedure GetCitiesByCountry(in countryCode char(3))
begin
	select `Name`, Population from City where CountryCode=countryCode order by `Name`;
end |

create procedure GetLanguageByCountry(in countryCode char(3))
begin
	select `Language`, Percentage from CountryLanguage where CountryCode=countryCode order by `Language`;
end |

delimiter ;