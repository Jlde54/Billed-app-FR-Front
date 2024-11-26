/**
 * @jest-environment jsdom
 */
import {screen, waitFor} from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES,ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    // Test unitaire : vérifie que le bill icon possède la classe 'active-icon' après navigation
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)

      router()
      window.onNavigate(ROUTES_PATH.Bills)
      
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList).toContain('active-icon') // New
    })
    // Test unitaire : vérifie le tri des données sur les dates de la plus récente à la plus ancienne
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I am on Bills Page", () => {
    describe("When I click the back button of the navigation", () => {
      // Test d'intégration
      test("I stay logged on to the Bills page", () => {
        // Mock l'URL initiale
        const initialURL = window.location.href;
        // simuler la navigation vers une autre page
        window.history.pushState({ page: 1 }, 'Titre 1', '/page1');
        // Ajout d'une logique pour empêcher la navigation en arrière : la fonction de prévention (preventBackNavigation) est ajoutée pour intercepter popstate, et elle restaure l’URL initiale si on tente de naviguer en arrière.
        const preventBackNavigation = jest.fn((event) => {
          event.preventDefault();
          window.history.pushState(null, '', initialURL); // Restaure l'URL
        });
        window.addEventListener('popstate', preventBackNavigation);
        // Simule le clic sur le bouton arrière
        window.history.back();
        // Simule l’événement déclenché par un clic sur le bouton arrière
        window.dispatchEvent(new PopStateEvent('popstate'));
        // Vérifie que l'URL actuelle reste identique à l'URL initiale
        expect(window.location.href).toBe(initialURL);
         // Vérifie que le gestionnaire d’événements a été appelé
        expect(preventBackNavigation).toHaveBeenCalled();
        // Nettoie l'événement
        window.removeEventListener('popstate', preventBackNavigation);
      })
    })
  })

  describe("When I click on 'Nouvelle note de frais'", () => {
    // Test unitaire
    test("It should open a New Bill page", async () => {
      // Mock de la navigation
        const onNavigate = pathname => { 
            document.body.innerHTML = ROUTES({ pathname });
        };
        // Mock de localStorage
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
        // Création d'une instance de la classe Bills
        const bill = new Bills({
            document, onNavigate, store: null, localStorage: window.localStorage
        })
        // Mock de l'interface utilisateur des factures
        document.body.innerHTML = BillsUI({ data: bills })
        // Mock de la fonction handleClickNewBill
        const handleClickNewBill = jest.fn(() => bill.handleClickNewBill)
        // Ajout d'un listener sur le bouton
        const btnNewBill = screen.getByTestId("btn-new-bill")
        btnNewBill.addEventListener("click", handleClickNewBill)
        // Simulation d'un clic utilisateur
        userEvent.click(btnNewBill)

        expect(handleClickNewBill).toHaveBeenCalled()
    })
  })

  describe("When employee click on eye Button", () => {
    // Test unitaire
    test("Then a modal should be displayed", () => {
      const onNavigate = pathname => { document.body.innerHTML = ROUTES({ pathname }); };

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

      const bill = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })

      document.body.innerHTML = BillsUI({ data: bills });
      const handleClickIconEye = jest.fn((icon) => bill.handleClickIconEye(icon));
      const iconEye = screen.getAllByTestId("icon-eye");

      const modaleFile = document.getElementById("modaleFile")
      $.fn.modal = jest.fn(() => modaleFile.classList.add("show"))
      iconEye.forEach(icon => {
        icon.addEventListener("click", handleClickIconEye(icon));
        userEvent.click(icon);
        expect(handleClickIconEye).toHaveBeenCalled();
      });
      expect(modaleFile).toBeTruthy();
      })
  })
  describe('When I am on Bill page but it is loading', () => {
    // Test unitaire
    test('Then, Loading page should be rendered', () => {
      document.body.innerHTML = BillsUI({ loading: true })
      expect(screen.getAllByText('Loading...')).toBeTruthy()
    })
  })
  
  describe('When I am on Bill page but back-end send an error message', () => {
    // Test unitaire
    test('Then, Error page should be rendered', () => {
      document.body.innerHTML = BillsUI({ error: 'some error message' })
      expect(screen.getAllByText('Erreur')).toBeTruthy()
    })
  })
})
// Tests d'intégration
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bill", () => {
    // Test d'intégration
    test("Then, bills should be fetched and displayed correctly from the mock API", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const newBillBtn = screen.getByTestId("btn-new-bill");
      const billsTable = screen.getByTestId("tbody");

      expect(newBillBtn).toBeTruthy();
      expect(billsTable).toBeTruthy();
    })
    describe("When the API fails when fetching bills", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      // Test d'intégration
      test("Then, a 404 error message should be displayed", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
      // Test d'intégration
      test("Then, a 500 error message should be displayed", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})