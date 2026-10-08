<?php
# Report helper functions (abn_*), English edition.

# 20260105 -> "January 5, 2026"
function abn_DATE2STR($val)
{
	$months = array("01" => "January", "02" => "February", "03" => "March", "04" => "April",
		"05" => "May", "06" => "June", "07" => "July", "08" => "August", "09" => "September",
		"10" => "October", "11" => "November", "12" => "December");
	$val = (string)$val;
	$m = substr($val, 4, 2);
	if(!isset($months[$m]))
		return $val;
	return $months[$m]." ".(int)substr($val, 6, 2).", ".substr($val, 0, 4);
}

# Integer -> English words: 1234 -> "one thousand two hundred thirty-four"
function abn_words($n)
{
	static $ones = array("", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
		"eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen");
	static $tens = array("", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety");
	static $scales = array(1000000000 => "billion", 1000000 => "million", 1000 => "thousand");
	$n = (int)$n;
	if($n === 0)
		return "zero";
	if($n < 0)
		return "minus ".abn_words(-$n);
	$out = array();
	foreach($scales as $size => $word)
		if($n >= $size){
			$out[] = abn_words(intdiv($n, $size))." ".$word;
			$n %= $size;
		}
	if($n >= 100){
		$out[] = $ones[intdiv($n, 100)]." hundred";
		$n %= 100;
	}
	if($n >= 20){
		$out[] = $tens[intdiv($n, 10)].($n % 10 ? "-".$ones[$n % 10] : "");
		$n = 0;
	}
	if($n > 0)
		$out[] = $ones[$n];
	return implode(" ", $out);
}

# Amount -> words with cents: 12.5 -> "Twelve dollars 50 cents" (name kept for report compatibility)
function abn_RUB2STR($L)
{
	$cents = (int)round(($L - (int)$L) * 100);
	$whole = (int)$L;
	$s = abn_words($whole)." ".($whole === 1 ? "dollar" : "dollars")." ".sprintf("%02d", $cents)." ".($cents === 1 ? "cent" : "cents");
	return ucfirst($s);
}

function abn_USD2STR($L)
{
	return abn_RUB2STR($L);
}

function abn_NUM2STR($L)
{
	return ucfirst(abn_words((int)$L));
}

# Transliterate the string and make a human readable URL slug
function abn_Translit($s)
{
	$s = mb_strtolower(strip_tags((string)$s));
	$s = str_replace(array("\n", "\r", " "), "_", $s);
	# Cyrillic letters (written as code points) -> Latin
	static $map = NULL;
	if($map === NULL){
		$map = array();
		$pairs = array(0x430 => 'a', 0x431 => 'b', 0x432 => 'v', 0x433 => 'g', 0x434 => 'd', 0x435 => 'e', 0x451 => 'e',
			0x436 => 'j', 0x437 => 'z', 0x438 => 'i', 0x439 => 'y', 0x43A => 'k', 0x43B => 'l', 0x43C => 'm', 0x43D => 'n',
			0x43E => 'o', 0x43F => 'p', 0x440 => 'r', 0x441 => 's', 0x442 => 't', 0x443 => 'u', 0x444 => 'f', 0x445 => 'h',
			0x446 => 'c', 0x447 => 'ch', 0x448 => 'sh', 0x449 => 'sh', 0x44B => 'y', 0x44D => 'e', 0x44E => 'yu',
			0x44F => 'ya', 0x44A => '', 0x44C => '');
		foreach($pairs as $cp => $lat)
			$map[mb_chr($cp, 'UTF-8')] = $lat;
	}
	$s = strtr($s, $map);
	if(function_exists('iconv')){
		$t = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
		if($t !== false)
			$s = $t;
	}
	return preg_replace("/[^0-9a-z-_]/i", "", $s);
}
