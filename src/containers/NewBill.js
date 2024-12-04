import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    // Récupère le formulaire et l'élément <input>
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    // Initialisation des variables
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    // Crée une instance de Logout pour gérer la déconnexion de l'utilisateur.
    new Logout({ document, localStorage, onNavigate })
  }
  // Traiter le fichier sélectionné par l'utilisateur dans le formulaire
  handleChangeFile = e => {
    e.preventDefault()
    const fileInput = this.document.querySelector(`input[data-testid="file"]`)
    const file = fileInput.files[0] // Récupère le fichier sélectionné
    if (file) {
      // Extraire l'extension du fichier et la mettre en minuscule
      const fileName = file.name
      const fileExtension = fileName.split('.').pop().toLowerCase()
      // Vérifier si l'extension est valide
      const allowedExtensions = ["jpg", "jpeg", "png"]
      if (!allowedExtensions.includes(fileExtension)) {
        // Afficher un message d'erreur et réinitialiser le champ de fichier
        alert("Seuls les fichiers au format JPG, JPEG, ou PNG sont acceptés.")
        fileInput.value = "" // Réinitialise la sélection de fichier
        return
      }
      // Si le fichier est valide, continuez avec le traitement
      const filePath = e.target.value.split(/\\/g)
      const email = JSON.parse(localStorage.getItem("user")).email
      const formData = new FormData()
      formData.append('file', file)
      formData.append('email', email)
      // Prépare les données pour l'envoi au serveur
      this.store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true
          }
        })
        // Envoie le fichier au backend
        .then(({ fileUrl, key }) => { // URL pour accéder au fichier et  clé unique (key) pour identifier la note de frais
          console.log(fileUrl)
          this.billId = key
          this.fileUrl = fileUrl
          this.fileName = fileName
        })
        // Les erreurs rencontrées lors de l'envoi sont loguées dans la console
        .catch(error => console.error(error))
    }
  }
  // Gère la soumission du formulaire pour ajouter une nouvelle note de frais
  handleSubmit = e => {
    e.preventDefault()
    // Vérification de la validité des champs du formulaire
    const type = e.target.querySelector(`select[data-testid="expense-type"]`).value;
    const name = e.target.querySelector(`input[data-testid="expense-name"]`).value;
    const amount = parseInt(e.target.querySelector(`input[data-testid="amount"]`).value);
    const date = e.target.querySelector(`input[data-testid="datepicker"]`).value;

    if (!type || !name || !amount || amount <= 0 || !date) {
        // Ne pas soumettre le formulaire si des champs sont invalides
        alert("Veuillez remplir tous les champs obligatoires avec des valeurs valides.");
        return;
    }
    // console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email
    // stockage dans bill des données du formulaire
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    this.updateBill(bill) // appel de l'envoi des données au backend
    this.onNavigate(ROUTES_PATH['Bills']) // redirige l'utilisateur vers la page des notes de frais (Bills)
  }

  // not need to cover this function by tests
  updateBill = (bill) => {  //  màj d'une note de frais existante dans le backend
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})  // bill est envoyé au backend avec la méthode update
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills']) // redirige vers la page des notes de frais
      })
      .catch(error => console.error(error))
    }
  }
}