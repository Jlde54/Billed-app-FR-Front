import {screen, waitFor, fireEvent} from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES,ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import userEvent from "@testing-library/user-event";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {
        test("Then bill icon in vertical layout should be highlighted", async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
        document.body.innerHTML = "";
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.NewBill)
        await waitFor(() => screen.getByTestId('icon-mail'))
        const mailIcon = screen.getByTestId('icon-mail')
        expect(mailIcon.classList).toContain('active-icon')
        })
        describe("When I upload a file with a wrong extension", () => {
            test("Then an alert is displayed", () => {
                // Initialisation de l'environnement
                window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))   // Simule un utilisateur connecté en tant qu'employé 
                document.body.innerHTML = NewBillUI();  // Charge l'interface utilisateur de la page NewBill 
                // Création d'une instance de NewBill
                window.alert = jest.fn();   //// Mock `alert` avant son utilisation
                const onNavigate = (pathname) => {
                    document.body.innerHTML = ROUTES({ pathname });
                };
                const store = null;
                const newBill = new NewBill({ document, onNavigate, store, localStorage });
                // Simulation du changement de fichier
                const handleChangeFile = jest.fn(newBill.handleChangeFile); // handleChangeFile est simulé via jest.fn() pour vérifier qu'il est appelé correctement
                const file = screen.getByTestId("file");    // Récupère l'élément <input type="file"> dans le DOM avec data-testid="file"
                file.addEventListener("change", handleChangeFile);

                fireEvent.change(file, {    // Simule le téléchargement d'un fichier au format PDF non accepté
                    target: {
                        files: [new File(["file.pdf"], "file.pdf", { type: "file/pdf" })],
                    },
                });
                // Vérifie que l'alerte est affichée
                // jest.spyOn(window, "alert");    // surveille les appels à alert
                expect(alert).toHaveBeenCalled();
                // Vérifie que handleChangeFile a bien été appelée lorsque l'utilisateur télécharge un fichier.
                expect(handleChangeFile).toHaveBeenCalled();
            })
        })

        describe("When I submit the form", () => {
            describe("When a user submit a valid form", () => {
                test("Then it should navigate to Bills page", async () => {
                    // Redéfinir localStorage dans l'environnement de test
                    Object.defineProperty(window, "localStorage", {
                        value: localStorageMock
                    });
                    // Simuler l'environnement
                    const onNavigate = jest.fn(); // Mock de la fonction de navigation
                    window.localStorage.setItem(
                        "user",
                        JSON.stringify({ type: "Employee" })
                    );
                    document.body.innerHTML = `
                        <form data-testid="form-new-bill">
                            <input data-testid="datepicker" value="2024-11-20" />
                            <select data-testid="expense-type"><option value="Transport">Transport</option></select>
                            <input data-testid="expense-name" value="Taxi" />
                            <input data-testid="amount" value="50" />
                            <input data-testid="vat" value="10" />
                            <input data-testid="pct" value="20" />
                            <textarea data-testid="commentary">Business trip</textarea>
                            <input data-testid="file" />
                            <button type="submit">Envoyer</button>
                        </form>
                    `;
                    const newBill = new NewBill({
                        document,
                        onNavigate,
                        store: null,
                        localStorage: window.localStorage,
                    });
                    // Simuler la soumission du formulaire
                    const form = screen.getByTestId("form-new-bill");
                    fireEvent.submit(form);

                    // Vérifications
                    expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]); // Vérifie la navigation
                });

                test("Then add a bill from mock API POST", async () => {
                    const postSpy = jest.spyOn(mockStore, "bills");
                    const bill = {
                        id: "47qAXb6fIm2zOKkLzMro",
                        email: "employee@test.tld",
                        type: "Transports",
                        name: "TGV Paris-Bruxelles",
                        amount: 120,
                        date: "2024-11-20",
                        vat: "24",
                        pct: 20,
                        commentary: "",
                        fileUrl: "TGVFacture.png",
                        fileName: "TGVFacture",
                        status: 'pending'
                    };
                    // Mock de la méthode `update` pour renvoyer exactement `bill`
                    mockStore.bills.mockImplementation(() => {
                        return {
                        update: jest.fn(() => Promise.resolve(bill)), // Renvoie `bill`
                        };
                    });
                    const postBills = await mockStore.bills().update(bill);
                    expect(postSpy).toHaveBeenCalledTimes(1);   // Vérifie que la méthode `bills().update` a été appelée
                    expect(postBills).toStrictEqual(bill);  // Vérifie que l'objet retourné correspond à `bill`
                });
            });
        })
        describe("When an error occurs on API", () => {
            beforeEach(() => {
                jest.clearAllMocks(); // Réinitialise tous les mocks

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

            test("Then fetches bills from an API and fails with 404 message error", async () => {
                // Redéfinir l'implémentation mockée
                mockStore.bills.mockImplementation(() => {
                    return {
                        list: jest.fn(() => Promise.reject(new Error("Erreur 404"))),
                    };
                });
            
                window.onNavigate(ROUTES_PATH.Bills);
                await new Promise(process.nextTick); // Attendre que la promesse soit rejetée
            
                const message = screen.getByText(/Erreur 404/);
                expect(message).toBeTruthy(); // Vérifie que le message d'erreur est affiché
            });
            
            test("Then fetches messages from an API and fails with 500 message error", async () => {
                // Redéfinir l'implémentation mockée
                mockStore.bills.mockImplementation(() => {
                    return {
                        list: jest.fn(() => Promise.reject(new Error("Erreur 500"))),
                    };
                });
            
                window.onNavigate(ROUTES_PATH.Bills);
                await new Promise(process.nextTick); // Attendre que la promesse soit rejetée
            
                const message = screen.getByText(/Erreur 500/);
                expect(message).toBeTruthy(); // Vérifie que le message d'erreur est affiché
            });
        });
    })
})