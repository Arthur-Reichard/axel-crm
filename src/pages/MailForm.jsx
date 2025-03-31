import { useState } from 'react';

export default function EmailForm() {
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    // Ici, tu déclenches ton envoi d'email via API
    // Exemple : await sendEmail(formData)

    console.log('Email envoyé :', formData);
    alert("Email envoyé !");
  };

  return (
    <form onSubmit={handleSend} className="p-4 space-y-4 bg-white shadow rounded">
      <input
        type="email"
        name="to"
        placeholder="Destinataire"
        required
        value={formData.to}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
      <input
        type="email"
        name="cc"
        placeholder="CC"
        value={formData.cc}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
      <input
        type="email"
        name="bcc"
        placeholder="CCI"
        value={formData.bcc}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        name="subject"
        placeholder="Objet"
        required
        value={formData.subject}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
      <textarea
        name="body"
        placeholder="Contenu de l'email"
        required
        value={formData.body}
        onChange={handleChange}
        className="w-full p-2 border rounded h-40"
      />
      <button
        type="submit"
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Envoyer
      </button>
    </form>
  );
}
