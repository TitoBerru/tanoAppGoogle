import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import StudentList from "./components/StudentList";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AdminPanel from "./components/AdminPanel";
import ThirdTimePanel from "./components/ThirdTimePanel";
import MatchPanel from "./components/MatchPanel";
import * as XLSX from "xlsx";
import GoogleConnections from "./components/GoogleConnections";

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [absences, setAbsences] = useState({});
  const [students, setStudents] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showThirdTimePanel, setShowThirdTimePanel] = useState(false);
  const [showMatchPanel, setShowMatchPanel] = useState(false);
  const [items, setItems] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [googleData, setGoogleData] = useState([]);

  const handleDataFetch = (data) => {
    setGoogleData(data);
  };

  const studentsData =
    googleData.length > 0
      ? googleData.slice(1).map((player) => ({
          id: player.jugador_id,
          name: player.name,
          nickname: player.nickname,
          position: player.position,
          dorsal: player.dorsal,
        }))
      : [];

  useEffect(() => {
    const sortedStudents = [...studentsData].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    setStudents(sortedStudents);
    // console.log(sortedStudents)

    const initialAbsences = {};
    const dateKey = new Date().toISOString().split("T")[0];
    studentsData.forEach((student) => {
      initialAbsences[student.id] = { [dateKey]: true };
    });
    setAbsences(initialAbsences);
  }, [googleData]);

  const handleToggleAbsence = (studentId) => {
    const dateKey = selectedDate.toISOString().split("T")[0];
    setAbsences((prevAbsences) => {
      const studentAbsences = prevAbsences[studentId] || {};
      return {
        ...prevAbsences,
        [studentId]: {
          ...studentAbsences,
          [dateKey]: !studentAbsences[dateKey],
        },
      };
    });
  };

  const handleAddStudent = (name, nickname, position) => {
    const newStudent = { id: students.length + 1, name, nickname, position };
    setStudents((prevStudents) => [...prevStudents, newStudent]);

    const dateKey = selectedDate.toISOString().split("T")[0];
    setAbsences((prevAbsences) => {
      return {
        ...prevAbsences,
        [newStudent.id]: { [dateKey]: true },
      };
    });
  };

  const handleEditStudent = (id, name, nickname, position) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === id ? { ...student, name, nickname, position } : student
      )
    );
  };

  const handleDeleteStudent = (id) => {
    setStudents((prevStudents) =>
      prevStudents.filter((student) => student.id !== id)
    );
    setAbsences((prevAbsences) => {
      const newAbsences = { ...prevAbsences };
      delete newAbsences[id];
      return newAbsences;
    });
  };

  const handleAddItem = (name, responsible) => {
    setItems((prevItems) => [...prevItems, { name, responsible }]);
  };

  const handleDeleteItem = (index) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const generateWhatsAppMessage = () => {
    const dateKey = selectedDate.toISOString().split("T")[0];
    let message = `Listado de asistencia para el ${dateKey}:\n\n`;

    let totalStudents = 0;
    let totalPresent = 0;
    let totalAbsent = 0;

    students.forEach((student) => {
      const isAbsent = absences[student.id]?.[dateKey] || false;
      totalStudents++;
      if (isAbsent) {
        totalAbsent++;
        message += `${student.name}: Ausente\n`;
      } else {
        totalPresent++;
        message += `${student.name}: Presente\n`;
      }
    });

    message += `\nResumen:\n`;
    message += `Total de jugadores: ${totalStudents}\n`;
    message += `Total presentes: ${totalPresent}\n`;
    message += `Total ausentes: ${totalAbsent}`;

    return message;
  };

  const handleSendWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleDownloadExcel = () => {
    const dateKey = selectedDate.toISOString().split("T")[0];
    const wsData = students.map((student) => {
      const isAbsent = absences[student.id]?.[dateKey] || false;
      return {
        Nombre: student.name,
        Apodo: student.nickname,
        Posición: student.position,
        Ausente: isAbsent ? "Sí" : "No",
      };
    });

    let totalStudents = students.length;
    let totalPresent = students.filter(
      (student) => !absences[student.id]?.[dateKey]
    ).length;
    let totalAbsent = totalStudents - totalPresent;

    wsData.push({});
    wsData.push({
      Nombre: "Resumen",
      Apodo: `Total jugadores: ${totalStudents}`,
      Posición: `Total presentes: ${totalPresent}`,
      Ausente: `Total ausentes: ${totalAbsent}`,
    });

    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencia");

    XLSX.writeFile(workbook, `asistencia_${dateKey}.xlsx`);
  };


  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="container mx-auto p-4">
        <div className="mb-4">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="yyyy/MM/dd"
            className="p-2 border rounded"
          />
        </div>

        {/* Botón de hamburguesa */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 bg-gray-800 text-white rounded md:hidden"
        >
          {menuOpen ? "Cerrar Opciones" : "Mas Opciones"}
        </button>

        {/* Opciones del menú */}

        {menuOpen && (
          <div className="flex flex-col md:hidden">
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="p-2 bg-green-500 text-white rounded mb-2"
            >
              {showAdminPanel ? "Cerrar Administrador" : "Administrador"}
            </button>
            <button
              onClick={() => setShowThirdTimePanel(!showThirdTimePanel)}
              className="p-2 bg-orange-500 text-white rounded mb-2"
            >
              {showThirdTimePanel ? "Cerrar 3er Tiempo" : "3er Tiempo"}
            </button>
            <button
              onClick={() => setShowMatchPanel(!showMatchPanel)}
              className="p-2 bg-yellow-500 text-white rounded mb-2"
            >
              {showMatchPanel ? "Cerrar Partido" : "Partido"}
            </button>
          </div>
        )}
        <GoogleConnections onDataFetch={handleDataFetch}
        absencesData={absences}
        selectedDate={selectedDate} />
        {/* Botones en pantallas grandes */}
        <div className="hidden md:flex mb-4 space-x-4">
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="p-2 bg-green-500 text-white rounded"
          >
            {showAdminPanel ? "Cerrar Administrador" : "Administrador"}
          </button>

          <button
            onClick={() => setShowThirdTimePanel(!showThirdTimePanel)}
            className="p-2 bg-orange-500 text-white rounded"
          >
            {showThirdTimePanel ? "Cerrar 3er Tiempo" : "3er Tiempo"}
          </button>

          <button
            onClick={() => setShowMatchPanel(!showMatchPanel)}
            className="p-2 bg-yellow-500 text-white rounded"
          >
            {showMatchPanel ? "Cerrar Partido" : "Partido"}
          </button>
        </div>

        {/* {console.log({googleData})} */}
        {/* Mostrar la lista de estudiantes */}
        {!showAdminPanel && !showThirdTimePanel && !showMatchPanel && (
          <>
            <StudentList
              students={students}
              selectedDate={selectedDate}
              absences={absences}
              onToggleAbsence={handleToggleAbsence}
            />

            {/* Botón para descargar el Excel debajo del listado */}
            <button
              onClick={handleDownloadExcel}
              className="p-2 bg-blue-500 text-white rounded mt-4"
            >
              Descargar Excel
            </button>

            {/* Botón para enviar por WhatsApp */}
            <button
              onClick={handleSendWhatsApp}
              className="p-2 bg-green-500 text-white rounded mt-4 ml-2"
            >
              Enviar por WhatsApp
            </button>
          </>
        )}

        {/* Mostrar el panel de partido */}
        {showMatchPanel && <MatchPanel />}

        {/* Mostrar el panel de administrador */}
        {showAdminPanel && (
          <AdminPanel
            students={students}
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {/* Mostrar el panel de 3er Tiempo */}
        {showThirdTimePanel && (
          <ThirdTimePanel
            items={items}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
          />
        )}
      </main>
    </div>
  );
}

export default App;
