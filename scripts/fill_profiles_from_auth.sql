-- SQL skript: auth.users.id bo'yicha profiles jadvalini to'ldirish
insert into profiles (id)
select id from auth.users
where id not in (select id from profiles);
