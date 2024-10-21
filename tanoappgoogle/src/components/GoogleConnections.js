

import React, { useState, useEffect } from 'react';
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;

const API_KEY = process.env.REACT_API_KEY;
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const SHEET_ID = process.env.REACT_APP_SHEET_ID;
const SHEET_RANGE = 'jugadores!A:E'; // El rango de la hoja
const SHEET_RANGE_UPDATE = 'Asistencia!B2:D'  

function GoogleConnections({ onDataFetch, absencesData, selectedDate}) {
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [data, setData] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Cargar las bibliotecas de Google API y Google Identity Services
    const loadGapiScript = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = gapiLoaded;
      document.body.appendChild(script);
    };

    const loadGisScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = gisLoaded;
      document.body.appendChild(script);
    };

    loadGapiScript();
    loadGisScript();
  }, []);

  const gapiLoaded = () => {
    window.gapi.load('client', initializeGapiClient);
  };

  const initializeGapiClient = async () => {
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    setGapiInited(true);
    maybeEnableButtons();
  };

  const gisLoaded = () => {
    const tokenClientInstance = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          console.error(response);
          return;
        }
        setIsAuthorized(true);
        listMajors();
      },
    });
    setTokenClient(tokenClientInstance);
    setGisInited(true);
    maybeEnableButtons();
  };

  const maybeEnableButtons = () => {
    if (gapiInited && gisInited) {
      document.getElementById('authorize_button').style.visibility = 'visible';
    }
  };

  const handleAuthClick = () => {
    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  };

  const handleSignoutClick = () => {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken(null);
      setIsAuthorized(false);
      setData(null);
    }
  };

  const listMajors = async () => {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: SHEET_RANGE, // Ejemplo: 'SheetName!A:Z' o el rango necesario
      });
      const result = response.result;
      if (!result.values || result.values.length === 0) {
        setData('No data found.');
      } else {
        const output = result.values.map((row) => ({
          jugador_id : row[0],
          name :row[1],
          nickname: row[2],
          position: row[3],
          dorsal: row[4]
        }));
        setData(output);
        onDataFetch(output);
        // console.log(output)
      }
    } catch (err) {
      console.error(err.message)
      setData(`Error: ${err.message}`);
    }
  };

  // Enviar datos a google sheets 
  const updateSheet = async () => {
    const spreadsheetId = SHEET_ID;
    const range = SHEET_RANGE_UPDATE; // Cambia esto según tu configuración de Google Sheets
    const dateKey = selectedDate.toISOString().split("T")[0];

    const values = Object.entries(absencesData).map(([studentId, absenceData]) => {
      return [String(studentId) ,absenceData[dateKey] ? "Ausente" : "Presente",new Date().toISOString().split("T")[0]];
    });

    const body = {
      values: values,
    };
    console.log(body)

    await window.gapi.client.sheets.spreadsheets.values
      .update({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: "USER_ENTERED",
        resource: body,
      })
      .then((response) => {
        console.log(`${response.result.updatedCells} celdas actualizadas.`);
      })
      .catch((error) => {
        console.error("Error actualizando la hoja de Google Sheets:", error);
      });
  };
  //termina enviar datos a google sheet


  return (
    <div>
     {!isAuthorized &&(
      <button id="authorize_button" className="p-2 bg-green-500 text-white rounded mb-2" onClick={handleAuthClick}>
        Iniciar Sesion 
      </button>
      )}
      {isAuthorized && (
        <button id="signout_button" className="p-2 bg-red-500 text-white rounded m-2" onClick={handleSignoutClick}>
        Desconectar
        </button>
      )}
       {/* Botón para actualizar la hoja de Google */}
       <button onClick={updateSheet} className="p-2 bg-blue-500 text-white rounded">
        Actualizar Google Sheet 2
      </button>
      {/* <pre id="content">{data}</pre> */}
    </div>
  );
}





export default GoogleConnections;
