set terminal svg size 700, 300
s(x) = x<0 ? sin(x) : sin(x-(pi/4)) 
set samples 1000
plot s(x) with lines ls 1