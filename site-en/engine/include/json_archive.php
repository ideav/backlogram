<?php


require_once __DIR__ . "/delimiters.php";
require_once __DIR__ . "/field_attrs.php";

defined("JSON_ARCHIVE_FORMAT")  || define("JSON_ARCHIVE_FORMAT", "integram-archive");
defined("JSON_ARCHIVE_VERSION") || define("JSON_ARCHIVE_VERSION", 1);
defined("JSON_ARCHIVE_CLEAR")   || define("JSON_ARCHIVE_CLEAR", " ");

class JsonArchiveError extends Exception {}

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------

function JsonArchiveSplit($s){
	return UnHideDelimiters(explode(":", HideDelimiters((string)$s)));
}

function JsonArchiveParseTypeHead($head){
	$p = JsonArchiveSplit($head);
	return array(
		"id" => (int)$p[0],
		"name" => isset($p[1]) ? UnMaskDelimiters($p[1]) : "",
		"base" => (isset($p[2]) && $p[2] !== "") ? $p[2] : "",
		"unique" => isset($p[3]) && $p[3] === "unique"
	);
}

function JsonArchiveParseReq($reqId, $s){
	$p = JsonArchiveSplit($s);
	$kind = isset($p[0]) ? $p[0] : "";
	if($kind === "ref")
		return array("id" => (int)$reqId, "kind" => "ref", "refRow" => isset($p[2]) ? (int)$p[2] : 0
					, "attrs" => isset($p[3]) ? UnMaskDelimiters($p[3]) : "");
	if($kind === "arr")
		return array("id" => (int)$reqId, "kind" => "arr", "type" => isset($p[1]) ? (int)$p[1] : 0
					, "attrs" => isset($p[2]) ? UnMaskDelimiters($p[2]) : "");
	if($kind === "subst")
		return array("id" => (int)$reqId, "kind" => "subst", "attrs" => "");
	return array("id" => (int)$reqId, "kind" => "field", "name" => UnMaskDelimiters($kind)
				, "base" => isset($p[1]) ? $p[1] : "", "attrs" => isset($p[2]) ? UnMaskDelimiters($p[2]) : "");
}


function JsonArchiveColumnsFromStruct($localStruct, $typeId){
	$columns = array();
	if(!isset($localStruct[$typeId]))
		return $columns;
	foreach($localStruct[$typeId] as $reqId => $s){
		if($reqId === 0 || $reqId === "0")
			continue;
		$col = JsonArchiveParseReq($reqId, $s);
		$attrs = FieldAttrsParse($col["attrs"]);
		$col["key"] = $attrs["key"];
		$col["multi"] = $attrs["multi"];
		if($col["kind"] === "ref")
			$col["type"] = JsonArchiveRefTarget($localStruct, $col["refRow"]);
		if(($col["kind"] === "ref") || ($col["kind"] === "arr")){
			$col["target"] = JsonArchiveTypeName($localStruct, $col["type"]);
			$col["name"] = ($attrs["alias"] !== null && $attrs["alias"] !== "") ? $attrs["alias"] : $col["target"];
		}
		$columns[] = $col;
	}
	return $columns;
}

function JsonArchiveRefTarget($localStruct, $refRow){
	if(!$refRow || !isset($localStruct[$refRow][0]))
		return 0;
	$p = JsonArchiveSplit($localStruct[$refRow][0]);
	return isset($p[1]) ? (int)$p[1] : 0;
}

function JsonArchiveTypeName($localStruct, $typeId){
	if(!$typeId || !isset($localStruct[$typeId][0]))
		return "";
	$head = JsonArchiveParseTypeHead($localStruct[$typeId][0]);
	return $head["name"];
}

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------

function JsonArchiveColumnKey($col, $columns){
	$name = isset($col["name"]) ? $col["name"] : "";
	if($name === "")
		return (string)$col["id"];
	$same = 0;
	foreach($columns as $other)
		if(isset($other["name"]) && $other["name"] === $name)
			$same++;
	return $same > 1 ? $name."#".$col["id"] : $name;
}


function JsonArchiveBindColumns($doc, $columns, $resolved){
	$wanted = JsonArchiveWantedColumns($doc);
	$byLocal = array();
	foreach($wanted as $n => $want){
		if(!isset($resolved[$n]) || !(int)$resolved[$n])
			continue;
		$local = (int)$resolved[$n];
		$keys = array(JsonArchiveColumnKey($want, $wanted), (string)$want["id"]);
		if($want["name"] !== "")
			$keys[] = $want["name"];
		$byLocal[$local] = isset($byLocal[$local]) ? array_merge($byLocal[$local], $keys) : $keys;
	}
	foreach($columns as $n => $col)
		$columns[$n]["keys"] = isset($byLocal[(int)$col["id"]])
								? array_values(array_unique($byLocal[(int)$col["id"]])) : array();
	return $columns;
}

function JsonArchiveFieldValue($fields, $col, $columns){
	if(isset($col["keys"])){
		foreach($col["keys"] as $key)
			if(is_array($fields) && array_key_exists($key, $fields))
				return array("found" => true, "value" => $fields[$key]);
		return array("found" => false, "value" => null);
	}
	foreach(array(JsonArchiveColumnKey($col, $columns), (string)$col["id"]) as $key)
		if(is_array($fields) && array_key_exists($key, $fields))
			return array("found" => true, "value" => $fields[$key]);
	if(isset($col["name"]) && $col["name"] !== "" && is_array($fields) && array_key_exists($col["name"], $fields)){
		$same = 0;
		foreach($columns as $other)
			if(isset($other["name"]) && $other["name"] === $col["name"])
				$same++;
		if($same === 1)
			return array("found" => true, "value" => $fields[$col["name"]]);
	}
	return array("found" => false, "value" => null);
}

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------


function JsonArchiveMatchColumn($want, $columns){
	$kind = isset($want["kind"]) ? $want["kind"] : "field";
	$wantId = isset($want["id"]) ? (int)$want["id"] : 0;
	if($wantId)
		foreach($columns as $col)
			if(((int)$col["id"] === $wantId) && ($col["kind"] === $kind) && JsonArchiveSameShape($want, $col))
				return (int)$col["id"];
	$name = isset($want["name"]) ? (string)$want["name"] : "";
	if($name !== "")
		foreach($columns as $col)
			if(($col["kind"] === $kind) && isset($col["name"]) && ($col["name"] === $name) && JsonArchiveSameShape($want, $col))
				return (int)$col["id"];
	$target = isset($want["target"]) ? (string)$want["target"] : "";
	if((($kind === "ref") || ($kind === "arr")) && ($target !== ""))
		foreach($columns as $col)
			if(($col["kind"] === $kind) && isset($col["target"]) && ($col["target"] === $target))
				return (int)$col["id"];
	return 0;
}

function JsonArchiveSameShape($want, $col){
	$kind = isset($want["kind"]) ? $want["kind"] : "field";
	if($kind === "field"){
		$base = isset($want["base"]) ? (string)$want["base"] : "";
		return ($base === "") || ($base === (string)$col["base"]);
	}
	if(($kind === "ref") || ($kind === "arr")){
		$target = isset($want["target"]) ? (string)$want["target"] : "";
		if(($target !== "") && isset($col["target"]) && ($col["target"] !== ""))
			return $col["target"] === $target;
		$type = isset($want["type"]) ? (int)$want["type"] : 0;
		if($type && isset($col["type"]) && ((int)$col["type"] === $type))
			return true;
		$name = isset($want["name"]) ? (string)$want["name"] : "";
		return ($name !== "") && isset($col["name"]) && ($col["name"] === $name);
	}
	return true;
}

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------

function JsonArchiveDecode($text){
	$text = (string)$text;
	if(substr($text, 0, 3) === pack("CCC", 0xef, 0xbb, 0xbf))
		$text = substr($text, 3);
	$doc = json_decode($text, true);
	if(json_last_error() !== JSON_ERROR_NONE)
		throw new JsonArchiveError("Could not parse the JSON archive: ".json_last_error_msg());
	if(!is_array($doc))
		throw new JsonArchiveError("The JSON archive must be an object");
	if(!isset($doc["format"]) || ($doc["format"] !== JSON_ARCHIVE_FORMAT))
		throw new JsonArchiveError("Not an Integram archive: expected \"format\":\"".JSON_ARCHIVE_FORMAT."\"");
	if(isset($doc["version"]) && ((int)$doc["version"] > JSON_ARCHIVE_VERSION))
		throw new JsonArchiveError("Archive version ".(int)$doc["version"]." is newer than the supported ".JSON_ARCHIVE_VERSION);
	if(!isset($doc["rows"]) || !is_array($doc["rows"]))
		throw new JsonArchiveError("The archive has no \"rows\" array");
	foreach($doc["rows"] as $n => $row)
		if(!is_array($row))
			throw new JsonArchiveError("Row ".($n + 1)." of the archive is not an object");
	$doc["table"] = isset($doc["table"]) ? (int)$doc["table"] : 0;
	if(!isset($doc["types"]) || !is_array($doc["types"]))
		$doc["types"] = array();
	return $doc;
}

function JsonArchiveTableType($doc){
	if(!count($doc["types"]))
		return NULL;
	if($doc["table"] && isset($doc["types"][(string)$doc["table"]]))
		return $doc["types"][(string)$doc["table"]];
	if(count($doc["types"]) === 1)
		return reset($doc["types"]);
	return NULL;
}

function JsonArchiveWantedColumns($doc){
	$type = JsonArchiveTableType($doc);
	if(($type === NULL) || !isset($type["reqs"]) || !is_array($type["reqs"]))
		return array();
	$columns = array();
	foreach($type["reqs"] as $req){
		if(!is_array($req))
			continue;
		$kind = isset($req["kind"]) ? (string)$req["kind"] : "field";
		$columns[] = array(
			"id" => isset($req["id"]) ? (int)$req["id"] : 0,
			"kind" => $kind,
			"name" => isset($req["name"]) ? (string)$req["name"] : "",
			"base" => isset($req["base"]) ? (string)$req["base"] : "",
			"type" => isset($req["type"]) ? (int)$req["type"] : 0,
			"target" => isset($req["target"]) ? (string)$req["target"] : "",
			"multi" => isset($req["multi"]) ? (bool)$req["multi"] : false,
			"key" => isset($req["key"]) ? (bool)$req["key"] : false,
			"attrs" => isset($req["attrs"]) ? (string)$req["attrs"] : ""
		);
	}
	return $columns;
}


function JsonArchiveRowValues($row, $columns, $withParent=false){
	$object = array();
	if($withParent)
		$object[] = isset($row["parent"]) ? JsonArchiveScalar($row["parent"], "parent") : "";
	$object[] = array_key_exists("val", $row) && ($row["val"] !== null) ? JsonArchiveScalar($row["val"], "val") : "";
	$fields = isset($row["fields"]) && is_array($row["fields"]) ? $row["fields"] : array();
	foreach($columns as $col){
		if($col["kind"] === "arr" || $col["kind"] === "subst"){
			$object[] = "";
			continue;
		}
		$found = JsonArchiveFieldValue($fields, $col, $columns);
		if(!$found["found"]){
			$object[] = "";
			continue;
		}
		$value = $found["value"];
		if($value === null){
			$object[] = JSON_ARCHIVE_CLEAR;
			continue;
		}
		if(is_array($value)){
			if(($col["kind"] !== "ref") || !$col["multi"])
				throw new JsonArchiveError("Column \"".JsonArchiveColumnKey($col, $columns)."\" is not a multi-reference, an array of values is not allowed");
			$refs = array();
			foreach($value as $item)
				$refs[] = JsonArchiveScalar($item, JsonArchiveColumnKey($col, $columns));
			$object[] = count($refs) ? $refs : JSON_ARCHIVE_CLEAR;
			continue;
		}
		$object[] = JsonArchiveScalar($value, JsonArchiveColumnKey($col, $columns));
	}
	return $object;
}

function JsonArchiveScalar($value, $where){
	if(is_bool($value))
		return $value ? "1" : "-1";
	if(is_int($value) || is_float($value))
		return (string)$value;
	if(is_string($value))
		return $value;
	throw new JsonArchiveError("Invalid value in \"$where\": expected a string, a number or null");
}

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------


function ImportField($object, $n, $json=false){
	if(!isset($object[$n]))
		return "";
	if($json || is_array($object[$n]))
		return $object[$n];
	return UnMaskDelimiters($object[$n]);
}

function ImportHasValue($object, $n){
	if(!isset($object[$n]))
		return false;
	if(is_array($object[$n]))
		return count($object[$n]) > 0;
	return strlen($object[$n]) > 0;
}

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------

function JsonArchiveTypesFromStruct($localStruct){
	$types = array();
	foreach($localStruct as $typeId => $entry){
		if(!is_numeric($typeId) || !isset($entry[0]))
			continue;
		$parts = JsonArchiveSplit($entry[0]);
		if(isset($parts[0]) && ($parts[0] === "subst"))
			continue;
		$head = JsonArchiveParseTypeHead($entry[0]);
		if($head["base"] === "")
			continue;
		$type = array("id" => (int)$typeId, "name" => $head["name"], "base" => $head["base"]);
		if($head["unique"])
			$type["unique"] = true;
		$columns = JsonArchiveColumnsFromStruct($localStruct, $typeId);
		$type["reqs"] = array();
		foreach($columns as $col){
			if($col["kind"] === "subst")
				continue;
			$req = array("id" => (int)$col["id"], "kind" => $col["kind"], "name" => isset($col["name"]) ? $col["name"] : "");
			if($col["kind"] === "field")
				$req["base"] = $col["base"];
			else{
				$req["type"] = isset($col["type"]) ? (int)$col["type"] : 0;
				$req["target"] = isset($col["target"]) ? $col["target"] : "";
			}
			if($col["multi"])
				$req["multi"] = true;
			if($col["key"])
				$req["key"] = true;
			if($col["attrs"] !== "")
				$req["attrs"] = $col["attrs"];
			$type["reqs"][] = $req;
		}
		$types[(string)$typeId] = $type;
	}
	return $types;
}


function JsonArchiveAttrs($col){
	if(isset($col["attrs"]) && ((string)$col["attrs"] !== ""))
		return (string)$col["attrs"];
	if(empty($col["multi"]) && empty($col["key"]))
		return "";
	return FieldAttrsBuild("", false, !empty($col["multi"]), null, !empty($col["key"]));
}

function JsonArchiveEncode($doc){
	return json_encode($doc, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
}
