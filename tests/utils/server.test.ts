import "reflect-metadata";
import supertest from "supertest";
import createServer from "../../src/bootstrap/server";

const app = createServer();

const AUTHORIZATION_HEADER = "authorization";
const AUTHORIZATION_VALUE = "secret1";

describe("server", () => {
  describe("not found route", () => {
    describe("and without the authorization header", () => {
      it("should return a 404", async () => {
        const { body, statusCode } = await supertest(app).get("/some-random-path");

        expect(statusCode).toBe(404);
        expect(body).toEqual({ message: "Not found" });
      });
    });

    describe("and with the authorization header", () => {
      it("should return a 404", async () => {
        const { body, statusCode } = await supertest(app)
          .get("/some-random-path")
          .set(AUTHORIZATION_HEADER, AUTHORIZATION_VALUE);

        expect(statusCode).toBe(404);
        expect(body).toEqual({ message: "Not found" });
      });
    });
  });

  describe("OPTIONS call", () => {
    describe("should be allowed", () => {
      it("and should return a 200", async () => {
        const { body, statusCode } = await supertest(app).options("/random-api");

        expect(statusCode).toBe(200);
        expect(body).toEqual({});
      });
    });
  });
});
