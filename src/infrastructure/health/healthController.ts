import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import LOG from "../../library/logging";

@injectable()
export class HealthController {
  public healthCheck = (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      status: "UP",
      uptime: process.uptime(),
    });
  };

  public readinessCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        status: "UP",
        reasons: ["Service is ready"],
      });
    } catch (err: any) {
      LOG.error(err);
      res.status(500).json({
        status: "DOWN",
        reasons: [err.message],
      });
    }
  };
}
