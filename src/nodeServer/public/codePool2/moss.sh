#! /bin/bash

FILE=temp.txt

moss.pl -l python -d ./*/*.py >$FILE

while read line
do
	url=$line

done<$FILE

echo $url
rm $FILE


