var fs = require('fs');
var _ = require("underscore");
var docxParser = require('docx-parser');

var filename = process.argv[2];

var bibliography  = {};
var refs = {};

if(filename === "--help" || filename==="-h") {
    console.info("Usage node apa6Checker.js opari.docx");
}

var err1=[];
var err2=[];
var err3=[];

docxParser.parseDocx(filename, function(data){
     //Etsi kaikki viittaukset teksistä
    data = data.replace("\\n","\n");

    _.each(data.match(/\(.*?\)(\.|)/g)/*Esiparsinta*/, function(r) { //Kaikki teksti sulkujen sisältä + piste perästä, jos sattuu olemaan
        if(r.match(/([0-9]{4,}|(n\.d\.)|(s\. a\.))/) /*sisältää vuosiluvun tai .n.d tai s. a.*/) {
            if(r.match(/[a-zA-Z]{2,}/)) //Sisältää vähintään kaksi kirjainta
            {
                if(r.match(/(\)\.|\.\))/)) { //Sisältää ). tai .) lopun
                    refs[r]=0;
                } else {
                    //Virheellinen viittaus
                    if(!r.match(/Luettu /)) {
                        err3.push(r);
                    }
                }
            }
        }
    });

    
    //Etsi lähdeluettelo ja lähteet
    _.each(data.match(/^(.*)\((\d{4})\).*$/gm), function(r) {
        bibliography[r]=0;
    });


    _.each(_.keys(refs), function(r) {
        var n = r;
        r = r.replace("(","");
        r = r.replace(".) ","");
        r = r.replace("). ","");
        r = r.replace(") ","");

        r = r.replace(".)","");
        r = r.replace(").","");
        r = r.replace(")","");    
        
        try{
            var year = r.match(/(\d{4})$/)[0];
            var writers = r.match(/^(.*?), (\d{4})/)[1];
            
            var f = _.each(_.keys(bibliography), function(b) {
               if(b.indexOf(writers) !=-1 && b.indexOf("("+year+")") !=-1) {
                    bibliography[b]++;
                    refs[n]++;
               }
            });
            
        } catch(e) {
            console.info("Erska, ",r);
            return;
        }

    });


    _.each(bibliography, function(v,k) {
       if(v<=0) {
         err1.push(k);
       }
    }); 

    _.each(refs, function(v,k) {
       if(v<=0) {
         err2.push(k);
       }
    }); 


    console.info("Tarkistetaan viittaukset...");
    console.info("Lähdeluottelon koko: ", _.keys(bibliography).length);
    if(err1.length) {
        console.info("Ei viitattu seuraaviin lähteisiin:", JSON.stringify(err1,0,3));
    }

    if(err2.length) {
        console.info("Ei lähdettä seuraaville viittauksille:", JSON.stringify(err2,0,3));
    }

    if(err3.length) {
        console.info("Tarkista seuraavien viitteiden oikeellisuus ja kirjoitusasu:", JSON.stringify(err3,0,3));
    }

});