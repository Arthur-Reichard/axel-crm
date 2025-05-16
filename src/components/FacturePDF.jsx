import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontSize: 11,
    padding: 40,
    fontFamily: 'Helvetica',
    color: '#333'
  },
  header: {
    marginBottom: 20
  },
  title: {
    fontSize: 22,
    color: '#007bff',
    fontWeight: 'bold',
    marginBottom: 5
  },
  meta: {
    fontSize: 11,
    color: '#555'
  },
  section: {
    marginBottom: 12
  },
  box: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 10,
    backgroundColor: '#f9f9f9'
  },
  label: {
    fontWeight: 'bold'
  },
  table: {
    display: 'table',
    width: '100%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ccc',
    marginTop: 10
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableHeader: {
    backgroundColor: '#007bff',
    color: '#fff',
    fontWeight: 'bold'
  },
  cell: {
    padding: 6,
    flex: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc'
  },
  summary: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: '50%'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 4
  },
  notes: {
    marginTop: 30,
    fontSize: 10,
    color: '#555'
  },
  rowBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20
  },
  halfColumn: {
    width: '45%'
  },
  smallText: {
    fontSize: 10,
    marginBottom: 2
  }
});

const FacturePDF = ({ formData, total_ttc }) => {
  const formatDate = (str) => str?.split('-').reverse().join('/') || '—';
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>FACTURE</Text>
          <Text style={styles.meta}>N° facture : {formData.numero || '—'}</Text>
          <Text style={styles.meta}>Date : {formatDate(formData.date_facture)}</Text>
          <Text style={styles.meta}>Réf. client : {formData.reference_client || '—'}</Text>
        </View>

        <View style={styles.rowBlock}>
          <View style={styles.halfColumn}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>ÉMETTEUR</Text>
            <Text style={styles.smallText}>{formData.emetteur_nom}</Text>
            <Text style={styles.smallText}>{formData.emetteur_telephone}</Text>
            <Text style={styles.smallText}>{formData.emetteur_email}</Text>
            <Text style={styles.smallText}>{formData.emetteur_adresse}</Text>
          </View>
          <View style={styles.halfColumn}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>À L’ATTENTION DE</Text>
            <Text style={styles.smallText}>{formData.client}</Text>
            <Text style={styles.smallText}>{formData.reference_client}</Text>
            <Text style={styles.smallText}>{formData.adresse_facturation}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Objet :</Text>
          <Text>{formData.objet || '—'}</Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.cell}>#</Text>
            <Text style={styles.cell}>Description</Text>
            <Text style={styles.cell}>Quantité</Text>
            <Text style={styles.cell}>Prix unitaire</Text>
            <Text style={styles.cell}>Total</Text>
          </View>
          {(formData.lignes || []).map((ligne, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.cell}>{i + 1}</Text>
              <Text style={styles.cell}>{ligne.designation}</Text>
              <Text style={styles.cell}>{ligne.quantite}</Text>
              <Text style={styles.cell}>{ligne.prix_unitaire.toFixed(2)} €</Text>
              <Text style={styles.cell}>{(ligne.quantite * ligne.prix_unitaire).toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Sous-total HT</Text>
            <Text>{formData.total_ht} €</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>TVA ({formData.tva} %)</Text>
            <Text>{(parseFloat(formData.total_ht || 0) * (formData.tva / 100)).toFixed(2)} €</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Total TTC</Text>
            <Text>{total_ttc} €</Text>
          </View>
        </View>

        {formData.notes && (
          <View style={styles.notes}>
            <Text>Notes : {formData.notes}</Text>
          </View>
        )}

      </Page>
    </Document>
  );
};

export default FacturePDF;
