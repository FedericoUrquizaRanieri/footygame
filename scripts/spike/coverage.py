from common import *
con = connect()
inl = ','.join("'%s'" % x for x in LEAGUES)
show(con, f"""select competition_id, min(season) first_s, max(season) last_s, count(distinct season) seasons, count(*) games
from games where competition_id in ({inl}) group by 1 order by 1""")
show(con, "select type, count(*) from game_lineups group by 1")
show(con, f"""select g.competition_id, g.season, count(distinct g.game_id) games,
 count(distinct case when l.game_id is not null then g.game_id end) with_lineups
from games g left join (select distinct game_id from game_lineups) l on l.game_id = g.game_id::int
where g.competition_id in ('ARG1','BRA1','MLS1','PO1') group by 1,2 order by 1,2""")
