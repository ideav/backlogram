# -*- coding: utf-8 -*-
# Ф110-подобные данные (habr neoflex 451218): Форма(отчётная дата, точность) → Коды(код, сумма₽, сумма$).
# flat: показатель = объект(код) + реквизиты дата, точность, сумма₽, сумма$  (5 строк)
# hier: форма = объект(дата) + реквизит точность; показатель-ребёнок = объект(код) + 2 суммы (3 строки)
import random, csv, datetime, os

random.seed(110)
OUT = os.path.dirname(os.path.abspath(__file__))
N_DATES = 4470                      # как в статье
CODES_MEAN = 400                    # кодов на форму (200..600)
T_FORM, T_IND = 300, 301
R_DT, R_PREC, R_RUB, R_CCY = 2101, 2102, 2103, 2104

prefixes = ["A", "S16203", "IL", "B", "C11", "D2", "S16101", "K3"]
CODES = [f"{random.choice(prefixes)}/{i//10}.{i%10}" for i in range(2000)]

flat = csv.writer(open(os.path.join(OUT, "f_flat.csv"), "w", newline="", encoding="utf-8"))
hier = csv.writer(open(os.path.join(OUT, "f_hier.csv"), "w", newline="", encoding="utf-8"))
fid = hid = 0
def nf():
    global fid; fid += 1; return fid
def nh():
    global hid; hid += 1; return hid

d = datetime.date(2007, 1, 9)
n_ind = 0
for k in range(N_DATES):
    dt = d.isoformat()
    prec = "точная" if random.random() < 0.9 else "округлённая"
    gid = nh()
    hier.writerow([gid, 1, T_FORM, dt])
    hier.writerow([nh(), gid, R_PREC, prec])
    ncodes = random.randint(200, 600)
    for code in random.sample(CODES, ncodes):
        rub = f"{random.randrange(10**3, 10**12) / 100:.2f}"
        ccy = f"{random.randrange(0, 10**10) / 100:.2f}"
        # flat
        oid = nf()
        flat.writerow([oid, 1, T_IND, code])
        flat.writerow([nf(), oid, R_DT, dt])
        flat.writerow([nf(), oid, R_PREC, prec])
        flat.writerow([nf(), oid, R_RUB, rub])
        flat.writerow([nf(), oid, R_CCY, ccy])
        # hier
        oid = nh()
        hier.writerow([oid, gid, T_IND, code])
        hier.writerow([nh(), oid, R_RUB, rub])
        hier.writerow([nh(), oid, R_CCY, ccy])
        n_ind += 1
    d += datetime.timedelta(days=1 if random.random() < 0.8 else 2)

print("dates:", N_DATES, "indicators:", n_ind)
print("flat rows:", fid, f"({fid / n_ind:.2f}/показатель)")
print("hier rows:", hid, f"({hid / n_ind:.2f}/показатель)")
print(f"экономия строк: {(1 - hid / fid) * 100:.1f}%")
