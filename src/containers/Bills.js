import { ROUTES_PATH } from '../constants/routes.js'
import { formatDate, formatStatus } from "../app/format.js"
import Logout from "./Logout.js"

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store

    const buttonNewBill = document.querySelector(`button[data-testid="btn-new-bill"]`)
    if (buttonNewBill) buttonNewBill.addEventListener('click', this.handleClickNewBill)
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`)
    if (iconEye) iconEye.forEach(icon => {
      icon.addEventListener('click', () => this.handleClickIconEye(icon))
    })

    new Logout({ document, localStorage, onNavigate })
  }
  // naviguer vers la page de création d'une nouvelle note de frais
  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH['NewBill'])
  }
  // voir le fichier associé à une note de frais
  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url")
    const imgWidth = Math.floor($('#modaleFile').width() * 0.5)
    $('#modaleFile').find(".modal-body").html(`<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`)
    $('#modaleFile').modal('show')
  }
  // récupère les notes de frais depuis le backend
  getBills = () => {
    if (this.store) {
      return this.store.bills().list()  // récupére une liste de notes de frais
      .then(snapshot => {
        const bills = snapshot
          .map(doc => { // parcourt chaque élément récupéré
            try {
              return {
                ...doc,
                date: formatDate(doc.date), // formatte la date
                status: formatStatus(doc.status)  // formatte le status
              }
            } catch(e) {
              // if for some reason, corrupted data was introduced, we manage here failing formatDate function
              // log the error and return unformatted date in that case
              console.log(e,'for',doc)
              return {
                ...doc,
                date: doc.date,
                status: formatStatus(doc.status)
              }
            }
          })
        return bills
      })
    }
  }
}
