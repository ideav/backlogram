<?php


function ImportDbName($v)
{
    return UnMaskDelimiters($v);
}

function ImportReqSignature($typ, $subst = array())
{
    $kind = isset($typ[0]) ? $typ[0] : "";
    $first = isset($typ[1]) ? $typ[1] : "";
    $signature = $kind.":".ImportSubst($first, $subst);
    if($kind === "ref")
        $signature .= ":".ImportSubst(isset($typ[2]) ? $typ[2] : "", $subst);
    return $signature;
}

function ImportSubst($i, $subst)
{
    return isset($subst[$i]) ? $subst[$i] : $i;
}

function ImportMatchLocalReq($signature, $entries)
{
    if(!is_array($entries) || ($signature === ""))
        return 0;
    foreach($entries as $local_type => $local_value)
    {
        if((string)$local_type === "0")
            continue;
        if($local_value === $signature)
            return $local_type;
        if(substr($local_value, 0, strlen($signature) + 1) === $signature.":")
            return $local_type;
    }
    return 0;
}

# --------------------------------------------------------------------------------------------
#
#
#
# --------------------------------------------------------------------------------------------

function Import_map_terms(&$terms, &$imported, &$local_types, &$local_struct, &$warning)
{
    foreach($terms as $typ)
    {
        $srcTerm = (int)$typ[1];
        $srcOwner = (int)$typ[2];
        $signature = UnHideDelimiters(implode(":", array_slice($typ, 3)));
        $local = 0;
        if(isset($local_types[$srcOwner]))
            foreach($local_types[$srcOwner] as $order => $req_id)
                if(isset($imported[$srcOwner][$order]) && ($imported[$srcOwner][$order] === $signature))
                {
                    $local = $req_id;
                    break;
                }
        if($local)
            $local_struct["subst"][$srcTerm] = $local;
        else
            $warning .= t9n("[EN]Term $signature (id $srcTerm of owner $srcOwner) not found in the structure")."<br>";
    }
}

function Import_lit_fields(&$imported)
{
    $lit = Array();
    foreach($imported as $par => $reqs)
        foreach($reqs as $order => $req)
        {
            if($order == 0)
                continue;
            $typ = UnHideDelimiters(explode(":", HideDelimiters($req)));
            if(in_array($typ[0], array("Filter (from)", "Filter (to)", "WHERE", "HAVING")))
                $lit[$par][$order] = 1;
        }
    return $lit;
}

function Import_subst_literals($str, $subst, $exists, $count, &$warning)
{
    if(!preg_match("/IN\s*\(\s*[0-9,\s]+\s*\)/i", $str))
        return $str;
    return preg_replace_callback("/(IN\s*\(\s*)([0-9,\s]+?)(\s*\))/i"
        , function($m) use ($subst, $exists, $count, &$warning){
            $out = "";
            foreach(preg_split("/\s*,\s*/", trim($m[2])) as $id)
            {
                if($id === "")
                    continue;
                $id = (int)$id;
                $local = isset($subst[$id]) ? $subst[$id] : $id;
                if(($local == $id) && !$exists($id))
                    $warning .= t9n("[EN]Line $count: value $id (filter literal) not found in the DB")."<br>";
                $out .= ($out === "" ? "" : ",").$local;
            }
            return $m[1].$out.$m[3];
        }, $str);
}
