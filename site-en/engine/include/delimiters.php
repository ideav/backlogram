<?php


defined("DELIM_HIDE_BACKSLASH") || define("DELIM_HIDE_BACKSLASH", "\x01");
defined("DELIM_HIDE_COLON")     || define("DELIM_HIDE_COLON",     "\x02");
defined("DELIM_HIDE_SEMICOLON") || define("DELIM_HIDE_SEMICOLON", "\x03");
defined("DELIM_HIDE_COMMA")     || define("DELIM_HIDE_COMMA",     "\x04");

function MaskDelimiters($v)
{
    return str_replace(";", "\;", str_replace(":", "\:", str_replace("\\", "\\\\", $v)));
}
function UnMaskDelimiters($v)
{
    return str_replace("\;", ";", str_replace("\:", ":", str_replace("\\\\", "\\", UnHideDelimiters($v))));
}
function HideDelimiters($v)
{
    return str_replace("\,", DELIM_HIDE_COMMA
            , str_replace("\;", DELIM_HIDE_SEMICOLON
            , str_replace("\:", DELIM_HIDE_COLON
            , str_replace("\\\\", DELIM_HIDE_BACKSLASH, $v))));
}
function UnHideDelimiters($v)
{
    return str_replace(DELIM_HIDE_COMMA, "\,"
            , str_replace(DELIM_HIDE_SEMICOLON, "\;"
            , str_replace(DELIM_HIDE_COLON, "\:"
            , str_replace(DELIM_HIDE_BACKSLASH, "\\\\", $v))));
}
