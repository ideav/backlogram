<?php
# OAuth sign-in with GitHub and Google.
#
#   GET /auth/github               -> redirect to GitHub (state cookie set)
#   GET /auth/github?code&state    -> callback: token exchange, verified primary email,
#                                     find-or-create the user in `my`, workspace on first login
#   GET /auth/google  (same; /auth.asp is an alias of the Google callback)
#
# Callback URLs to register with the providers: <INTEGRAM_BASE_URL>/auth/github and
# <INTEGRAM_BASE_URL>/auth/google.
#
# Users live in the `my` table: USER (t=18) val = the email, EMAIL requisite = the email,
# the provider id is kept in the "social" requisite (t=274) as "github:<id>" / "google:<sub>".
# An existing account with the same verified email is signed in (and confirmed, if the email
# sign-up was still pending) instead of creating a duplicate.

define("EN_SOCIAL", 274);   # "social" requisite of USER in `my`
define("EN_PICTURE", 280);  # "Picture" requisite of USER in `my`

function enOAuthConfig($provider){
    $base = enBaseUrl();
    if($provider === "github")
        return array(
            "id" => GH_CLIENT_ID, "secret" => GH_CLIENT_PK,
            "authorize" => "https://github.com/login/oauth/authorize",
            "token" => "https://github.com/login/oauth/access_token",
            "scope" => "read:user user:email",
            "redirect" => "$base/auth/github",
            "name" => "GitHub");
    return array(
        "id" => G_CLIENT_ID, "secret" => G_CLIENT_PK,
        "authorize" => "https://accounts.google.com/o/oauth2/v2/auth",
        "token" => "https://oauth2.googleapis.com/token",
        "scope" => "openid email profile",
        "redirect" => "$base/auth/google",
        "name" => "Google");
}

function enHttp($url, $post = NULL, $headers = array()){
    $ch = curl_init($url);
    $headers[] = "Accept: application/json";
    $headers[] = "User-Agent: Integram-OAuth";
    if($post !== NULL){
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post));
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if($raw === FALSE || $code >= 400)
        wlog("[OAuth] HTTP $code from $url $err", "log");
    return json_decode((string)$raw, TRUE);
}

function enOAuthFail($reason){
    wlog("[OAuth] failed: $reason", "log");
    login("", "", "oauthError", $reason);
}

function enOAuth($provider){
    $cfg = enOAuthConfig($provider);
    if($cfg["id"] === "" || $cfg["secret"] === "")
        enOAuthFail($cfg["name"]." sign-in is not configured on this server.");
    if(isset($_GET["error"]))
        enOAuthFail($cfg["name"].": ".(isset($_GET["error_description"]) ? $_GET["error_description"] : $_GET["error"]));

    $cookieOpts = array("expires" => time() + 600, "path" => "/", "secure" => enIsHttps(),
                        "httponly" => TRUE, "samesite" => "Lax");
    if(empty($_GET["code"])){  # Step 1: send the browser to the provider
        enBotGuard("oauth");
        $state = bin2hex(random_bytes(16));
        setcookie("oauth_state", "$provider.$state", $cookieOpts);
        $params = array("client_id" => $cfg["id"], "redirect_uri" => $cfg["redirect"],
                        "scope" => $cfg["scope"], "state" => $state);
        if($provider === "google"){
            $params["response_type"] = "code";
            $params["prompt"] = "select_account";
        }
        else
            $params["allow_signup"] = "true";
        header("Location: ".$cfg["authorize"]."?".http_build_query($params));
        die();
    }

    # Step 2: the callback. The state must match the cookie set in step 1.
    $expected = isset($_COOKIE["oauth_state"]) ? (string)$_COOKIE["oauth_state"] : "";
    setcookie("oauth_state", "", array("expires" => time() - 3600) + $cookieOpts);
    if($expected === "" || !hash_equals($expected, $provider.".".(string)(isset($_GET["state"]) ? $_GET["state"] : "")))
        enOAuthFail("The sign-in session has expired. Please try again.");

    $token = enHttp($cfg["token"], array("client_id" => $cfg["id"], "client_secret" => $cfg["secret"],
                    "code" => $_GET["code"], "redirect_uri" => $cfg["redirect"], "grant_type" => "authorization_code"));
    if(empty($token["access_token"]))
        enOAuthFail($cfg["name"].": ".(isset($token["error_description"]) ? $token["error_description"] : "token exchange failed"));
    $auth = array("Authorization: Bearer ".$token["access_token"]);

    if($provider === "github"){
        $user = enHttp("https://api.github.com/user", NULL, $auth);
        if(empty($user["id"]))
            enOAuthFail("GitHub did not return the user profile.");
        $email = "";
        $emails = enHttp("https://api.github.com/user/emails", NULL, $auth);
        if(is_array($emails))
            foreach($emails as $e)
                if(!empty($e["primary"]) && !empty($e["verified"]) && !empty($e["email"]))
                    $email = $e["email"];
        if($email === "")
            enOAuthFail("Your GitHub account has no verified primary email address.");
        $socialId = "github:".(int)$user["id"];
        $name = !empty($user["name"]) ? $user["name"] : (isset($user["login"]) ? $user["login"] : "");
        $picture = isset($user["avatar_url"]) ? $user["avatar_url"] : "";
    }
    else{
        $user = enHttp("https://openidconnect.googleapis.com/v1/userinfo", NULL, $auth);
        if(empty($user["sub"]))
            enOAuthFail("Google did not return the user profile.");
        if(empty($user["email"]) || empty($user["email_verified"]))
            enOAuthFail("Your Google account has no verified email address.");
        $email = $user["email"];
        $socialId = "google:".preg_replace('/[^0-9A-Za-z_-]/', '', $user["sub"]);
        $name = isset($user["name"]) ? $user["name"] : "";
        $picture = isset($user["picture"]) ? $user["picture"] : "";
    }
    enSocialLogin($socialId, strtolower(trim($email)), $name, $picture, $cfg["name"]);
}

# Find or create the `my` user, make sure they have a workspace, set the cookies, redirect.
function enSocialLogin($socialId, $email, $name, $picture, $providerName){
    global $z;
    $z = "my";
    $sid = addslashes($socialId);
    $mail = addslashes($email);
    $name = mb_substr(trim(strip_tags((string)$name)), 0, 100);
    $userSql = "SELECT user.id uid, token.id tok, token.val token, xsrf.id xsrf, act.id act, pwd.id pid, pwd.val pwd,"
              ." (SELECT db.val FROM my db WHERE db.up=user.id AND db.t=".DATABASE." ORDER BY db.id LIMIT 1) db"
              ." FROM my user LEFT JOIN my token ON token.up=user.id AND token.t=".TOKEN
              ." LEFT JOIN my xsrf ON xsrf.up=user.id AND xsrf.t=".XSRF
              ." LEFT JOIN my act ON act.up=user.id AND act.t=".ACTIVITY
              ." LEFT JOIN my pwd ON pwd.up=user.id AND pwd.t=".PASSWORD
              ." WHERE user.t=".USER;
    $row = mysqli_fetch_array(Exec_sql("$userSql AND user.id=(SELECT s.up FROM my s WHERE s.t=".EN_SOCIAL." AND s.val='$sid' LIMIT 1)"
                                        , "Find $providerName user by provider id"));
    if(!$row)  # Same verified email signed up before (by email or with another provider)
        $row = mysqli_fetch_array(Exec_sql("$userSql AND user.id=(SELECT e.up FROM my e JOIN my u ON u.id=e.up AND u.t=".USER
                                            ." WHERE e.t=".EMAIL." AND e.val='$mail' ORDER BY e.up LIMIT 1)"
                                            , "Find $providerName user by email"));
    if($row){
        $uid = (int)$row["uid"];
        if(!mysqli_fetch_array(Exec_sql("SELECT 1 FROM my WHERE up=$uid AND t=".EN_SOCIAL." AND val='$sid'", "Check provider link")))
            Insert($uid, 1, EN_SOCIAL, $socialId, "Link $providerName to the user");
        if(!$row["db"] && $row["pid"] && $row["token"] && preg_match('/^[a-f0-9]{64}$/', $row["pwd"]))
            # A pending email sign-up: the provider verified the address, so finish the confirmation
            # the same way the link from the email does (the stored password hash becomes active).
        {
            Update_Val($row["pid"], $row["token"]);
            $row["token"] = secureToken();  # and the session token gets a fresh random value
            Update_Val($row["tok"], $row["token"]);
        }
        updateTokens($row);  # Signs in to `my`: token, xsrf, idb_my cookie
        if($row["db"]){
            $db = $row["db"];
            enWorkspaceCookie($db);
            header("Location: /$db");
            die();
        }
        createDb($uid, $name, $email);
    }
    else{
        $GLOBALS["GLOBAL_VARS"]["token"] = secureToken();
        $GLOBALS["GLOBAL_VARS"]["xsrf"] = xsrf($GLOBALS["GLOBAL_VARS"]["token"], $z);
        $uid = newUser($email, $email, "115", $name, $picture);
        Insert($uid, 1, EN_SOCIAL, $socialId, "Set provider id for the new $providerName user");
        Insert($uid, 1, TOKEN, $GLOBALS["GLOBAL_VARS"]["token"], "Set token for the new $providerName user");
        Insert($uid, 1, XSRF, $GLOBALS["GLOBAL_VARS"]["xsrf"], "Set xsrf for the new $providerName user");
        Insert($uid, 1, ACTIVITY, microtime(TRUE), "Set activity for the new $providerName user");
        if(isset($_COOKIE["_aff"]) && (int)$_COOKIE["_aff"] > 0)
            Insert($uid, 1, 1012, (int)$_COOKIE["_aff"], "Insert the $providerName affiliate ref");
        setcookie("idb_my", $GLOBALS["GLOBAL_VARS"]["token"], time() + 2592000*12, "/");
        mysendmail(ADMINEMAIL, "New $providerName sign-up on ".enHost().": $email", "Email: $email\n".enBaseUrl()."/my/object/".USER);
        createDb($uid, $name, $email);
    }
    # createDb() switched $z to the new workspace (it stays "my" if the name was taken).
    header("Location: /$z");
    die();
}

# Sign the browser in to an existing workspace: its admin user (val = workspace name) gets a token.
function enWorkspaceCookie($db){
    if(!preg_match(USER_DB_MASK, $db) || !mysqli_fetch_array(Exec_sql("SHOW TABLES LIKE '$db'", "Check workspace table")))
        return;
    $row = mysqli_fetch_array(Exec_sql("SELECT user.id, token.val tok, xsrf.val xsrf FROM $db user"
                ." LEFT JOIN $db token ON token.up=user.id AND token.t=".TOKEN
                ." LEFT JOIN $db xsrf ON xsrf.up=user.id AND xsrf.t=".XSRF
                ." WHERE user.val='$db' AND user.t=".USER, "Get workspace admin token"));
    if(!$row)
        return;
    $prev = $GLOBALS["z"];
    $GLOBALS["z"] = $db;  # Insert() writes into the current $z
    $token = $row["tok"];
    if(!$token){
        $token = secureToken();
        Insert($row["id"], 1, TOKEN, $token, "Set token for the workspace admin");
    }
    if(!$row["xsrf"])
        Insert($row["id"], 1, XSRF, xsrf($token, $db), "Set xsrf for the workspace admin");
    $GLOBALS["z"] = $prev;
    setcookie("idb_$db", $token, time() + 2592000*12, "/");
}
