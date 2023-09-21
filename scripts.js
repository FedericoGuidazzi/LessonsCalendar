$(document).ready(function() {
    let allLessons = new Set();
    let lessonsData;
    let subjectsArray = ["ModSem - MODELLAZIONE CONCETTUALE PER IL WEB SEMANTICO", "Aaut - APPRENDIMENTO AUTOMATICO", "Reti NDL9 - RETI NEURALI E DEEP LEARNING", "Ingl II - LINGUA INGLESE II"];

    async function buildCalendar(month, year) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = (firstDay.getDay() + 6) % 7;
        const calendarTable = document.getElementById("calendarTable");
        const calendarBody = calendarTable.getElementsByTagName("tbody")[0];
        calendarBody.innerHTML = "";
        lessonsData = await getLessonsData(year, month, daysInMonth);
        let lessonsDays = [];
        for(let i=1;i<32;i++){
            if(lessonsData[i]!=undefined){
                lessonsDays.push(i);
            }
        }
        const currentMonthYear = document.getElementById("currentMonthYear");
        currentMonthYear.textContent = `${new Intl.DateTimeFormat("it-IT", { month: "long" }).format(firstDay)} ${year}`;
        let day = 1;
        for (let i = 0; i < 6; i++) {
            const row = document.createElement("tr");

            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < startingDay) {
                    const cell = document.createElement("td");
                    row.appendChild(cell);
                } else if (day <= daysInMonth) {
                    const cell = document.createElement("td");
                    cell.textContent = day;
                    if (lessonsDays.includes(day)) {
                        cell.classList.add("has-data"); // Aggiungi una classe alla cella
                    }
                    row.appendChild(cell);
                    day++;
                }
            }

            calendarBody.appendChild(row);

            if (day > daysInMonth) {
                break;
            }
        }
    }

    async function getLessonsData(year, month, daysInMonth){
        return new Promise(async (resolve, reject) => {
        
            // URL a cui effettuare la richiesta POST
            const url = 'https://apache.prod.up.cineca.it/api/Impegni/getImpegniCalendarioPubblico';
            month += 1;
            
            // Dati da inviare nel corpo della richiesta
            const data = {
                "clienteId": "5852fd1ab7305612a8354d51",
                "dataFine": year + "-" + month + "-" + daysInMonth,
                "dataInizio": year + "-" + month + "-1",
                "linkCalendarioId": "613bd49941164e0018f0f1d7",
                "mostraImpegniAnnullati": true,
                "mostraIndisponibilitaTotali": false,
                "pianificazioneTemplate": false
            };

            // Impostazioni per la richiesta HTTP
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Tipo di contenuto JSON
                },
                body: JSON.stringify(data), // Converte i dati in formato JSON
            };

            try{
                // Effettua la richiesta
                const response = await fetch(url, requestOptions)
                const data = await response.json();
                var map = new Map();
                data.forEach(element=>allLessons.add(element["nome"]));
                data.filter(el=>subjectsArray.includes(el["nome"])).forEach(element => {
                        // Crea un oggetto Data dalla stringa
                        const date = new Date(element["dataInizio"]).getDate();
                        let roomString = "";
                        let floorString = "";
                        try{
                            roomString = element["risorse"].filter(el=>el["aula"] != undefined)[0]["aula"]["descrizione"];
                        }catch(error){
                            roomString = "Errore"
                        }
                        try{
                            floorString = element["risorse"].filter(el=>el["aula"] != undefined)[0]["aula"]["piano"]["descrizione"];
                        }catch(error){
                            floorString = "Errore"
                        }
                        if(date in map){
                            map[date].push({
                                name : element["nome"],
                                startTime : getLessonsTime(element["dataInizio"]),
                                endTime: getLessonsTime(element["dataFine"]),
                                room: roomString,
                                floor: floorString
                            });
                        } else{
                            map[date] = [{
                                name : element["nome"],
                                startTime : getLessonsTime(element["dataInizio"]),
                                endTime: getLessonsTime(element["dataFine"]),
                                room: roomString,
                                floor: floorString
                            }];
                        }
                    });
                    resolve(map);
            }catch(error){
                    // Gestisci gli errori qui
                    reject(error);
            }
        })
    }

    function getLessonsTime(dateString){
        const date = new Date(dateString);
        const options = {
            timeZone: 'Europe/Rome', // Imposta il fuso orario italiano
            hour12: false, // Usa il formato a 24 ore
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        };
        return new Intl.DateTimeFormat('it-IT', options).format(date);
    }

    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    buildCalendar(currentMonth, currentYear);

    document.getElementById("prevMonth").addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        buildCalendar(currentMonth, currentYear);
    });

    document.getElementById("nextMonth").addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        buildCalendar(currentMonth, currentYear);
    });

    const calendarBody = document.getElementById("calendarTable").getElementsByTagName("tbody")[0];
    const card = document.getElementById("card");
    const closeCardButton = document.getElementById("closeCard");

    calendarBody.addEventListener("click", (e) => {
        const clickedCell = e.target;

        if (clickedCell.tagName === "TD" && clickedCell.textContent !== "") {
            // Visualizza la card quando si fa clic su una cella
            card.style.display = "block";

            // Puoi personalizzare il contenuto della card qui
            // Ad esempio:
            let cardInnerText = "";
            lessonsData[clickedCell.textContent]
            .forEach(element=>{
                cardInnerText += "<h3>"+element["name"]+"</h3>\
                <div class='row'><div class='row'>\
                    <h4>Orario Inizio: "+element["startTime"]+"</h4>\
                </div>\
                <div class='row'>\
                    <h4>Orario Inizio: "+element["endTime"]+"</h4>\
                </div>";
                if(element["room"] != "Errore"){
                    cardInnerText += "<div class='row'>\
                    <h4>Classe: "+element["room"]+"</h4>\
                    </div>";
                }
                if(element["floor"] != "Errore"){
                    cardInnerText += "<div class='row'>\
                    <h4>Piano: "+element["floor"]+"</h4>\
                    </div>";
                }
                cardInnerText += "</div>";
            });
            card.querySelector("h3").textContent = "Orario del giorno " + clickedCell.textContent;
            card.querySelector("p").innerHTML = cardInnerText;
        }
    });

    // Aggiungi un gestore di eventi per chiudere la card quando si fa clic sul pulsante "Chiudi"
    closeCardButton.addEventListener("click", () => {
        card.style.display = "none";
    });
    var expanded = false;

    function showCheckboxes() {
        var checkboxes = document.getElementById("checkboxes");
        if (!expanded) {
            let html = "";
            allLessons.forEach(element=>html += "<label for='"+element+"'>\
                <input type='checkbox' id='"+element+"' />"+element+"</label>");
            document.getElementById("checkboxes").innerHTML = html;
            checkboxes.style.display = "block";
            expanded = true;
        } else {
            checkboxes.style.display = "none";
            expanded = false;
        }
    }
});