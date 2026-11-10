# Генератор стенда #918: 142 654 автора, 1 048 552 книги (объёмы статьи habr 414255).
# Детерминированный (seed 918). Пишет TSV для обычной схемы и для таблицы ядра.
import random, json, sys
R = random.Random(918)
NA, NB = 142654, 1048552
st = json.load(open('state.json', encoding='utf-8'))
A, B, rA, rP, rY = st['A'], st['B'], st['rAuthor'], st['rPages'], st['rYear']
lat_on = ['b','c','d','f','g','h','j','k','l','m','n','p','r','s','t','v','w','z','br','ch','cl','dr','gr','pr','st','th','tr','sh','']
lat_v = ['a','e','i','o','u','ia','ea','ou','y','ai']
lat_end = ['','n','r','s','l','t','m','x','ck','rd','ld','nt','ss']
cyr_on = ['б','в','г','д','ж','з','к','л','м','н','п','р','с','т','ф','х','ц','ч','ш','бр','вл','гр','др','кр','пр','ст','тр','св','']
cyr_v = ['а','е','и','о','у','я','ю','ы','ё','ей','ай','ов']
cyr_end = ['','н','р','с','л','т','м','в','к','й','ш']
def word(on, v, end, n):
    return ''.join(R.choice(on) + R.choice(v) for _ in range(n)) + R.choice(end)
def name(lat):
    on, v, end = (lat_on, lat_v, lat_end) if lat else (cyr_on, cyr_v, cyr_end)
    w = word(on, v, end, R.randint(1, 3)).capitalize()
    return w
lat_first = [name(True) for _ in range(3000)] + ['John', 'Mary', 'Peter', 'Anna', 'Lacey', 'Leon']
cyr_first = [name(False) for _ in range(3000)] + ['Иван', 'Анна', 'Пётр', 'Мария', 'Олег']
cyr_last_real = ['Волков', 'Иванов', 'Петров', 'Смирнов', 'Кузнецов', 'Лебедев', 'Соколов', 'Морозов']
authors = []
for i in range(NA):
    lat = R.random() < 0.5
    r = R.random()
    if r < 0.03:   # одно слово — имя или фамилия
        s = R.choice(lat_first if lat else cyr_first + cyr_last_real)
    else:
        last = R.choice(cyr_last_real) if (not lat and R.random() < 0.02) else name(lat)
        s = f"{R.choice(lat_first if lat else cyr_first)} {last}"
    authors.append(s[:128])
ru_words = ('белые паруса алые красный дом сад лес ночь день море ветер огонь путь звезда город река тайна сердце '
            'тёмные светлые долгие старые новые малые пары парки небо поле зима лето осень весна дорога остров берег '
            'книга песня сказка память голос тень свет время мир война любовь надежда вера золото серебро камень').split()
en_words = 'the of and night day sea wind fire road star city river secret heart dark light old new small sky field winter summer'.split()
voc = ru_words + en_words + [word(cyr_on, cyr_v, cyr_end, R.randint(1, 3)) for _ in range(15000)] + [word(lat_on, lat_v, lat_end, R.randint(1, 3)) for _ in range(8000)]
with open('classic_author.tsv', 'w', encoding='utf-8', newline='\n') as fa, open('classic_books.tsv', 'w', encoding='utf-8', newline='\n') as fb, \
     open('eav_rows.tsv', 'w', encoding='utf-8', newline='\n') as fe:
    nid = 10000
    aid = []
    for i, s in enumerate(authors, 1):
        fa.write(f"{i}\t{s}\n")
        fe.write(f"{nid}\t{A}\t1\t{i}\t{s}\n"); aid.append(nid); nid += 1
    for j in range(1, NB + 1):
        n = ' '.join((R.choice(ru_words) if R.random() < 0.3 else R.choice(voc)) for _ in range(R.randint(2, 5))).capitalize()[:256]
        a = R.randint(1, NA)
        pages = R.randint(20, 1000); year = R.randint(1950, 2025)
        fb.write(f"{j}\t{n}\t{a}\t{pages}\t{year}\n")
        bid = nid
        fe.write(f"{bid}\t{B}\t1\t{j}\t{n}\n")
        fe.write(f"{bid+1}\t{aid[a-1]}\t{bid}\t1\t{rA}\n")
        fe.write(f"{bid+2}\t{rP}\t{bid}\t1\t{pages}\n")
        fe.write(f"{bid+3}\t{rY}\t{bid}\t1\t{year}\n")
        nid += 4
print('ok', NA, NB, 'next id', nid)
