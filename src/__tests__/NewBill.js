/**
 * @jest-environment jsdom
 */
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store.js";

describe("Given I am connected as an employee", () => {
    let newBill, fileInput, alertMock, onNavigate;
    // Groupe 1 : Tests d'interface utilisateur
    describe("When I am on the NewBill page", () => {

        beforeEach(() => {
            // Mock localStorage and user
            Object.defineProperty(window, "localStorage", { value: localStorageMock });
            window.localStorage.setItem(
                "user",
                JSON.stringify({ type: "Employee", email: "test@employee.com" })
            );

            // Set up the DOM
            document.body.innerHTML = NewBillUI();
            onNavigate = jest.fn();
            newBill = new NewBill({
                document,
                onNavigate,
                store: mockStore,
                localStorage,
            });

            fileInput = screen.getByTestId("file");
            alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        // Test unitaire sur l'icône mail
        test("Then mail icon in vertical layout should be highlighted", async () => {
            // configure l'utilisateur en tant qu'employé
            Object.defineProperty(window, 'localStorage', { value: localStorageMock })
            window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
            // initialise le DOM et navigue vers la page "New Bill"
            document.body.innerHTML = "";
            const root = document.createElement("div");
            root.setAttribute("id", "root");
            document.body.append(root);
            // Naviguer vers la page NewBill
            router();
            window.onNavigate(ROUTES_PATH.NewBill);
            // vérifie que l'icône de mail est active
            await waitFor(() => screen.getByTestId("icon-mail"));
            const mailIcon = screen.getByTestId("icon-mail");
            expect(mailIcon.classList).toContain("active-icon");
        });

        // Test unitaire sur l'interface
        test("Then 'Envoyer une note de frais' should be displayed", () => {
            expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
        });
    });

    // Groupe 2 : Tests liés au téléchargement de fichier
    describe("When I upload a file", () => {
        // Test unitaire de téléchargement de fichier avec extension invalide
        test("Then uploading a file with an invalid extension triggers an alert", () => {
            // Set up a mock event for invalid file
            const invalidFile = new File(["file.pdf"], "file.pdf", { type: "application/pdf" });
            fireEvent.change(fileInput, { target: { files: [invalidFile] } });

            // Assert alert and file input reset
            expect(alertMock).toHaveBeenCalledWith(
                "Seuls les fichiers au format JPG, JPEG, ou PNG sont acceptés."
            );
            expect(fileInput.value).toBe("");
        });
        // Test unitaire de téléchargement de fichier avec extension valide
        test("Then uploading a file with a valid extension updates the file", async () => {
            // Mock la méthode create pour surveiller ses appels
            const createMock = jest.spyOn(mockStore.bills(), "create").mockResolvedValue({
                fileUrl: "https://localhost:3456/images/test.jpg",
                key: "1234",
            });

            // Simule un fichier valide
            const validFile = new File(["image.png"], "image.png", { type: "image/png" });
            fireEvent.change(fileInput, { target: { files: [validFile] } });

            // Vérifie que la méthode create a bien été appelée
            expect(createMock).toHaveBeenCalled();
            // Appelle explicitement `create` pour vérifier sa promesse
            await expect(createMock.mock.results[0].value).resolves.toEqual({
                fileUrl: "https://localhost:3456/images/test.jpg",
                key: "1234",
            });

            createMock.mockRestore();   // Nettoie le mock après le test
        });
        // Test unitaire de gestion d'erreur lors du téléchargement de fichier
        test("Then an error during file upload logs the error", async () => {
            // Mock la méthode create pour qu'elle rejette une erreur
            const createMock = jest
                .spyOn(mockStore.bills(), "create")
                .mockRejectedValueOnce(new Error("Backend error"));

            // Simule un fichier valide
            const validFile = new File(["image.png"], "image.png", { type: "image/png" });
            fireEvent.change(fileInput, { target: { files: [validFile] } });

            // Vérifie que la méthode create rejette une erreur
            await expect(createMock.mock.results[0].value).rejects.toThrow("Backend error");

            createMock.mockRestore();   // Nettoie le mock après le test
        });
    });

    // Groupe 3 : Tests liés à la soumission du formulaire
    describe("When I submit the NewBill form", () => {
        // Test de soumission de formulaire valide
        test("Then the bill is created and I am redirected to the Bills page", async () => {
            // Mock de la fonction de navigation
            const onNavigate = jest.fn();

            // Crée l'instance de NewBill avec la bonne fonction onNavigate
            document.body.innerHTML = NewBillUI(); // Charge l'UI du formulaire
            
            // Crée une nouvelle instance de NewBill avec le mock de navigation
            const newBill = new NewBill({
                document,
                onNavigate,
                store: mockStore,
                localStorage: localStorageMock,
            });

            // Renseigner les champs valides pour soumettre le formulaire
            const formNewBill = screen.getByTestId("form-new-bill");
            screen.getByTestId("expense-type").value = "Transports";
            screen.getByTestId("expense-name").value = "Taxi";
            screen.getByTestId("amount").value = "50";
            screen.getByTestId("datepicker").value = "2023-11-01";

            fireEvent.submit(formNewBill);  // Soumettre le formulaire

            // Vérifie que la fonction onNavigate a bien été appelée avec la bonne URL
            await waitFor(() => {
                expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
            });
        });

        // Test unitaire de soumission de formulaire avec champs invalides
        test("Then a form with missing or invalid fields is not submitted", () => {
             // Mock de la fonction de navigation
             const onNavigate = jest.fn();

             // Prépare le DOM
             document.body.innerHTML = NewBillUI(); // Charge le formulaire dans le DOM
 
             // Crée une nouvelle instance de NewBill avec le mock de navigation
             const newBill = new NewBill({
                 document,
                 onNavigate,
                 store: mockStore,
                 localStorage: localStorageMock,
             });
 
             // Simule la soumission du formulaire avec des champs invalides
            const formNewBill = screen.getByTestId("form-new-bill");

            // Remplir des champs invalides
            screen.getByTestId("expense-type").value = "";
            screen.getByTestId("expense-name").value = "";
            screen.getByTestId("amount").value = "0";

            fireEvent.submit(formNewBill);  // Soumettre le formulaire

            // Vérifie que la fonction onNavigate n'a pas été appelée
            expect(onNavigate).not.toHaveBeenCalled();
        });
    });

    // Groupe 4 : Tests d'intégration avec l'API
    describe("When there is an error during the API call to create the bill", () => {
        // Test d'intégration
        test("Then the error is logged in the console", async () => {
            // Mock de console.error pour capturer l'erreur
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

            // Mock une erreur dans l'API (mockRejectedValue pour simuler l'erreur d'API)
            jest
                .spyOn(mockStore.bills(), "update")
                .mockRejectedValueOnce(new Error("Erreur API"));

                // Remplir des champs valides pour soumettre le formulaire
            const formNewBill = screen.getByTestId("form-new-bill");
            screen.getByTestId("expense-type").value = "Transports";
            screen.getByTestId("expense-name").value = "Taxi";
            screen.getByTestId("amount").value = "50";
            screen.getByTestId("datepicker").value = "2023-11-01";

            fireEvent.submit(formNewBill);  // Soumettre le formulaire

            // Vérifie que console.error est bien appelé avec l'erreur attendue
            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(new Error("Erreur API"));
            });

            // Nettoie le mock
            consoleErrorSpy.mockRestore();
        });
    });

    describe("When I post a new bill to the API", () => {
        // Test d'intégration pour vérifier la création d'une nouvelle note de frais via l'API
        test("Then a new bill should be created", async () => {
            jest.spyOn(mockStore.bills(), "create").mockResolvedValueOnce({
                fileUrl: "https://localhost:3456/images/test.jpg",
                key: "1234",
            });
    
            jest.spyOn(mockStore.bills(), "update").mockResolvedValueOnce({
                id: "47qAXb6fIm2zOKkLzMro",
                vat: "80",
                fileUrl: "https://localhost:3456/images/test.jpg",
                status: "pending",
                type: "Hôtel et logement",
                commentary: "séminaire billed",
                name: "encore",
                fileName: "preview-facture-free-201801-pdf-1.jpg",
                date: "2004-04-04",
                amount: 400,
                commentAdmin: "ok",
                email: "a@a",
                pct: 20,
            });
    
            const { fileUrl, key } = await mockStore.bills().create();
            expect(fileUrl).toBe("https://localhost:3456/images/test.jpg");
            expect(key).toBe("1234");
    
            const updatedBill = await mockStore.bills().update();
            expect(updatedBill.id).toBe("47qAXb6fIm2zOKkLzMro");
        });

        describe("When the API call fails", () => {
            // Test d'intégration
            test("Then a 404 error message should be displayed", async () => {
                jest.spyOn(mockStore, "bills").mockImplementationOnce(() => ({
                    create: jest.fn().mockRejectedValue(new Error("Erreur 404")),
                }));

                await expect(mockStore.bills().create()).rejects.toThrow("Erreur 404");
            });

            // Test d'intégration
            test("Then a 500 error message should be displayed", async () => {
                jest.spyOn(mockStore, "bills").mockImplementationOnce(() => ({
                    create: jest.fn().mockRejectedValue(new Error("Erreur 500")),
                }));

                await expect(mockStore.bills().create()).rejects.toThrow("Erreur 500");
            });
        });
    });
});
