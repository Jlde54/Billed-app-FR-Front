/**
 * @jest-environment jsdom
 */
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store.js";

describe("Given I am connected as an employee", () => {
    
    // Tests liés à l'interface utilisateur
    describe("When I am on the NewBill page", () => {
        let newBill, fileInput, alertMock, onNavigate;

        beforeEach(() => {
            Object.defineProperty(window, "localStorage", { value: localStorageMock });
            window.localStorage.setItem(
                "user",
                JSON.stringify({ type: "Employee", email: "test@employee.com" })
            );
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

        test("Then mail icon in vertical layout should be highlighted", async () => {
            const root = document.createElement("div");
            root.setAttribute("id", "root");
            document.body.append(root);
            router();
            window.onNavigate(ROUTES_PATH.NewBill);
            await waitFor(() => screen.getByTestId("icon-mail"));
            const mailIcon = screen.getByTestId("icon-mail");
            expect(mailIcon.classList).toContain("active-icon");
        });

        test("Then 'Envoyer une note de frais' should be displayed", () => {
            document.body.innerHTML = NewBillUI();
            expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
        });
    });

    // Tests liés au téléchargement de fichier
    describe("When I upload a file", () => {
        test("Then uploading a file with an invalid extension triggers an alert", () => {
            const invalidFile = new File(["file.pdf"], "file.pdf", { type: "application/pdf" });
            fireEvent.change(fileInput, { target: { files: [invalidFile] } });
            expect(alertMock).toHaveBeenCalledWith(
                "Seuls les fichiers au format JPG, JPEG, ou PNG sont acceptés."
            );
            expect(fileInput.value).toBe("");
        });

        test("Then uploading a file with a valid extension updates the file", async () => {
            const createMock = jest.spyOn(mockStore.bills(), "create").mockResolvedValue({
                fileUrl: "https://localhost:3456/images/test.jpg",
                key: "1234",
            });

            const validFile = new File(["image.png"], "image.png", { type: "image/png" });
            fireEvent.change(fileInput, { target: { files: [validFile] } });

            expect(createMock).toHaveBeenCalled();
            await expect(createMock.mock.results[0].value).resolves.toEqual({
                fileUrl: "https://localhost:3456/images/test.jpg",
                key: "1234",
            });

            createMock.mockRestore();
        });

        test("Then an error during file upload logs the error", async () => {
            const createMock = jest
                .spyOn(mockStore.bills(), "create")
                .mockRejectedValueOnce(new Error("Backend error"));

            const validFile = new File(["image.png"], "image.png", { type: "image/png" });
            fireEvent.change(fileInput, { target: { files: [validFile] } });

            await expect(createMock.mock.results[0].value).rejects.toThrow("Backend error");

            createMock.mockRestore();
        });
    });

    // Tests liés à la soumission du formulaire
    describe("When I submit the NewBill form", () => {
        test("Then the bill is created and I am redirected to the Bills page", async () => {
            const onNavigate = jest.fn();
            const newBill = new NewBill({
                document,
                onNavigate,
                store: mockStore,
                localStorage: localStorageMock,
            });

            screen.getByTestId("expense-type").value = "Transports";
            screen.getByTestId("expense-name").value = "Taxi";
            screen.getByTestId("amount").value = "50";
            screen.getByTestId("datepicker").value = "2023-11-01";

            fireEvent.submit(screen.getByTestId("form-new-bill"));

            await waitFor(() => {
                expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
            });
        });

        test("Then a form with missing or invalid fields is not submitted", () => {
            const onNavigate = jest.fn();
            const newBill = new NewBill({
                document,
                onNavigate,
                store: mockStore,
                localStorage: localStorageMock,
            });

            screen.getByTestId("expense-type").value = "";
            screen.getByTestId("expense-name").value = "";
            screen.getByTestId("amount").value = "0";

            fireEvent.submit(screen.getByTestId("form-new-bill"));

            expect(onNavigate).toHaveBeenCalled();
        });
    });

    // Tests d'intégration avec l'API
    describe("When there is an error during the API call to create or update the bill", () => {
        test("Then the error is logged in the console", async () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
            jest
                .spyOn(mockStore.bills(), "update")
                .mockRejectedValueOnce(new Error("Erreur API"));

            screen.getByTestId("expense-type").value = "Transports";
            screen.getByTestId("expense-name").value = "Taxi";
            screen.getByTestId("amount").value = "50";
            screen.getByTestId("datepicker").value = "2023-11-01";

            fireEvent.submit(screen.getByTestId("form-new-bill"));

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(new Error("Erreur API"));
            });

            consoleErrorSpy.mockRestore();
        });

        test("Then a new bill is created and updated successfully", async () => {
            const createBill = jest.fn(mockStore.bills().create);
            const updateBill = jest.fn(mockStore.bills().update);

            const { fileUrl, key } = await createBill();

            expect(createBill).toHaveBeenCalledTimes(1);
            expect(key).toBe("1234");
            expect(fileUrl).toBe("https://localhost:3456/images/test.jpg");

            const newBill = updateBill();
            expect(updateBill).toHaveBeenCalledTimes(1);

            await expect(newBill).resolves.toEqual({
                id: "47qAXb6fIm2zOKkLzMro",
                vat: "80",
                fileUrl: "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
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
        });
    });

    describe("When API fetch fails with errors", () => {
        test("Then it fails with '404 page not found' error", async () => {
            const mockedBill = jest.spyOn(mockStore, "bills").mockImplementationOnce(() => ({
                create: jest.fn().mockRejectedValue(new Error("Erreur 404")),
            }));

            await expect(mockedBill().create).rejects.toThrow("Erreur 404");
            expect(mockedBill).toHaveBeenCalledTimes(1);
        });

        test("Then it fails with '500 Internal Server error'", async () => {
            const mockedBill = jest.spyOn(mockStore, "bills").mockImplementationOnce(() => ({
                create: jest.fn().mockRejectedValue(new Error("Erreur 500")),
            }));

            await expect(mockedBill().create).rejects.toThrow("Erreur 500");
            expect(mockedBill).toHaveBeenCalledTimes(1);
        });
    });
});