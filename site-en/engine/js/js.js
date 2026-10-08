function byId(i){
    return document.getElementById(i);
}
function getCookie(name){
    var matches=document.cookie.match(new RegExp("(?:^|; )"+name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g,'\\$1')+"=([^;]*)"));
    return matches?decodeURIComponent(matches[1]):undefined;
}
function t9n(text){
    var l=text.indexOf(locale);
    if(l==-1)
        return text;
    l = l + locale.length;
    var n = text.substring(l).search(/\[[A-Z]{2}\]/);
    if(n==-1)
        return text.substring(l);
    return text.substring(l,n+l);
}
// Fetch the locale from cookie
function replacer(match,a,b,c,d){
    return t9n(d);
}
function localize(){
    document.title=t9n(document.title);
    // Translate the content of the t9n class
    $('.t9n').each(function(index){
        // Get inner HTML of all tags with t9n, capture <t9n> tags, and process those with t9n()
        this.innerHTML=this.innerHTML.replace(/((&lt;t9n&gt;)|(<t9n>))(.*?)((&lt;\/t9n&gt;)|(<\/t9n>))/gm, replacer);
        $(this).removeClass('t9n'); // remove the t9n class to show this element
    });
    // Translate the content of the t9n tags
    $('t9n').each(function(index){
        $(this).replaceWith(t9n($(this).html()));
    });
}
function post(a){
	byId('post').action+=a;
	byId('post').submit();
	event.preventDefault?event.preventDefault():(event.returnValue=false);
}
var search=window.location.search.substr(1).split('&').reduce(function(result,item){
    var parts=item.split('=');
    result[parts[0]]=parts[1];
    return result;
}, {});

//var locale=getCookie((db||'my')+'_locale') || navigator.language || navigator.userLanguage;
var locale=getCookie((db||'my')+'_locale') || 'RU';
if(search.locale){
    locale=search.locale;
    document.cookie=(db||'my')+'_locale='+(locale.toUpperCase()=='EN'?'EN':'RU');
}
if(locale.toUpperCase().indexOf('EN')===-1)
    locale='[EN]';  // The locale was found

function newApi(m,u,b,vars,index){
    vars=vars||'';
    var json,obj=new XMLHttpRequest();
    obj.open(m,'/'+db+'/'+u,true);
    if(m=='POST')
        if(typeof vars=='object')
            vars.append('_xsrf',xsrf);
        else{
            obj.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
            vars='_xsrf='+xsrf+'&'+vars;
        }
    $('#warn').html('').addClass('hidden');
    obj.onload=function(e){
        try{
            json=JSON.parse(this.responseText);
        }
        catch(e){
            $('#warn').html(this.responseText).removeClass('hidden');
        }
        obj.abort();
        if(typeof window[b]==='function')
            window[b](json,index);
    };
    obj.send(vars);
}
function autoLayout(str){
    let replacer={'q':'\u0439','w':'\u0446','e':'\u0443','r':'\u043a','t':'\u0435','y':'\u043d','u':'\u0433','i':'\u0448','o':'\u0449','p':'\u0437','[':'\u0445',']':'\u044a','a':'\u0444','s':'\u044b', 'd':'\u0432','f':'\u0430'
            ,'g':'\u043f','h':'\u0440','j':'\u043e','k':'\u043b','l':'\u0434',';':'\u0436','\'':'\u044d','z':'\u044f','x':'\u0447','c':'\u0441','v':'\u043c','b':'\u0438','n':'\u0442','m':'\u044c',',':'\u0431','.':'\u044e','/':'.'};
    return str.replace(/[A-z/,.;\'\]\[]/g, function(x){
        return x===x.toLowerCase()?replacer[x]:replacer[x.toLowerCase()].toUpperCase();
    });
}
var bt={'3':'SHORT','8':'CHARS','9':'DATE','13':'NUMBER','14':'SIGNED','11':'BOOLEAN','12':'MEMO','4':'DATETIME'
        ,'10':'FILE','2':'HTML','7':'BUTTON','6':'PWD','5':'GRANT','15':'CALCULATABLE','16':'REPORT_COLUMN','17':'PATH'};
function decodeMeta(json){
    var i,meta={};
    meta.typ=json.id;
    meta.typ_name=json.val;
    meta.reqs={};
    for(i in json.reqs){
        meta.reqs[json.reqs[i].id]={
            type:json.reqs[i].val,
            order:i,
            value:'',
            type:json.reqs[i].val,
            arr:0,
            base:bt[json.reqs[i].type]
        };
        if(json.reqs[i].ref_id){
            meta.reqs[json.reqs[i].id].ref_type=json.reqs[i].ref_id;
            meta.reqs[json.reqs[i].id].ref=json.reqs[i].ref;
            meta.reqs[json.reqs[i].id].attrs=json.reqs[i].attrs;
        }
    }
    return meta;
}
function validateEmail(email){
    return (email||'').match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
}
function iGetTemplate(path,rep,name,fd){
    if($('head script[src="/js/jszip.min.js"]').length===0){
        var ele = document.createElement('script');
        ele.setAttribute("type", "text/javascript");
        ele.setAttribute("src", '/js/jszip.min.js');
        $('head').append(ele);
        ele.setAttribute("src", '/js/FileSaver.min.js');
        $('head').append(ele);
    }
    fetch(path)
         .then(response => response.blob())
         .then(content => {newApi('POST','report/'+rep+'?JSON_KV','iGetTemplateDone',fd||'',{path:path,name:name,content:content});})
       .catch(error => { console.error('Error:', error); });
}
function iGetTemplateDone(json,vars) {
    var reader = new FileReader();
    reader.onload = function (e) {
        var i,j,data = new Uint8Array(e.target.result)
            ,zip = new JSZip();
        zip.loadAsync(data)
            .then(function(zip){
                zip.file("word/document.xml").async("string").then(function(xmlfile){
                    //console.log(xmlfile);
                    let newxml=isprXML(xmlfile);
                    for(i in json)
                        for(j in json[i])
                            newxml = newxml.replaceAll('{'+j+(i>0?i:'')+'}',json[i][j]);
                    for(j in json[0])
                        newxml = newxml.replace(new RegExp('\\{'+j+'\\d*?\\}','gmu'),'');
                    zip.file("word/document.xml", newxml);
			        var promise = null;
                    if(JSZip.support.uint8array)
                        promise = zip.generateAsync({ type: "uint8array" });
                    //zip2.file(my_json.File+'.docx', promise);
                    zip.generateAsync({ type: "blob" })
					.then(function (blob) {
						saveAs(blob, vars.name||'out.docx');
					});
                });
            });
    };
    reader.readAsArrayBuffer(vars.content);       
}
function isprXML(xmlfile) {
    var re = new RegExp('({'+'.*?})','sg');
    var re2 = /(<.*?>)/g;
    let result = xmlfile.match(re) || [];
    let newres = [];
    result.forEach(element => {
                var newel = element.replace(re2, "");
                xmlfile = xmlfile.replace(element, newel);
            });
     return xmlfile;
}