/**
 * @jest-environment jsdom
 */
import { screen, waitFor, fireEvent } from "@testing-library/dom"  // waitFor new
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"

import {localStorageMock} from "../__mocks__/localStorage.js";  // New
import router from "../app/Router.js";  // New
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";  // New
import '@testing-library/jest-dom'; // New
import mockStore from "../__mocks__/store";  // New
import userEvent from "@testing-library/user-event" // New

const setupLocalStorage = (userType = "Employee") => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  window.localStorage.setItem('user', JSON.stringify({ type: userType }));
};

const setupDOM = (path = ROUTES_PATH.NewBill) => {
  document.body.innerHTML = "";
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
  window.onNavigate(path);
};

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    setupLocalStorage();
  });
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      setupDOM();
    });
    test("Then mail icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.classList).toContain('active-icon') // New
    })
    describe("When I submit a new Bill", () => {
      let newBillInstance;

      beforeEach(() => {
        const html = NewBillUI();
        document.body.innerHTML = html;
        
        newBillInstance = new NewBill({
          document, 
          onNavigate: (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
          },
          store: mockStore, 
          localStorage: window.localStorage
        });
      });

      test("Then the bill should be saved ", async () => {
        const formNewBill = screen.getByTestId("form-new-bill")
        expect(formNewBill).toBeTruthy()
        const handleSubmit = jest.fn((e) => newBillInstance.handleSubmit(e));
        formNewBill.addEventListener("submit", handleSubmit);
        fireEvent.submit(formNewBill);
        expect(handleSubmit).toHaveBeenCalled();
      });

      test("Then the NewBill page should be displayed correctly", async () => {
        setupDOM(); // Navigue vers la page
        await waitFor(() => screen.getByTestId('form-new-bill')); // Vérifie qu'un élément clé est présent
        const formNewBill = screen.getByTestId('form-new-bill');
        expect(formNewBill).toBeTruthy(); // Assertion pour valider l'affichage
      });

      test("Then verify the file bill", async() => {
        jest.spyOn(mockStore, "bills")
  
        const file = new File(['image'], 'image.png', {type: 'image/png'});
        const billFile = screen.getByTestId('file');
        const formNewBill = screen.getByTestId("form-new-bill")

        const handleChangeFile = jest.fn(newBillInstance.handleChangeFile);
        const handleSubmit = jest.fn(newBillInstance.handleSubmit);
  
        billFile.addEventListener("change", handleChangeFile);    
        formNewBill.addEventListener("submit", handleSubmit); 

        userEvent.upload(billFile, file)
        
        expect(billFile.files[0].name).toBeDefined()
        expect(handleChangeFile).toBeCalled()
            
        fireEvent.submit(formNewBill);

        expect(handleSubmit).toHaveBeenCalled();
      })
    })
  })
})